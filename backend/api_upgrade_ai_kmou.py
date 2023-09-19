from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Response, Request, Header
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse, UJSONResponse, FileResponse
from dateutil.relativedelta import relativedelta
from functools import reduce
import openpyxl
from openpyxl.utils import range_boundaries
import random
from calendar import monthrange
from typing import List, Optional, Union
import traceback
from fastapi import FastAPI
from pydantic import BaseModel

from sqlalchemy import create_engine
from configparser import ConfigParser
import psycopg2
import pandas as pd
import os

from datetime import datetime, timedelta, date

import time

import base64
from pathlib import Path
import shutil

from pytz import timezone
import json

import traceback
from requests.auth import HTTPDigestAuth

import xlsxwriter

import uvicorn
import cv2
import mediapipe as mp
import numpy as np
import time

import ArcFace
from mtcnn.mtcnn import MTCNN
import matplotlib.pyplot as plt
import cv2
from tensorflow.keras.preprocessing import image

model = ArcFace.loadModel()
face_detector = MTCNN()

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(min_detection_confidence=0.5, min_tracking_confidence=0.5)

mp_drawing = mp.solutions.drawing_utils

drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1)


app = FastAPI()

origins = [    
    "https://hr.ailab.vn:3008",
    "https://hr.ailab.vn",
    "https://edu.ailab.vn:3010",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hostname = 'edu.ailab.vn'                                                                          

def config(filename='config.ini', section='aiface'):
    # create a parser
    parser = ConfigParser()
    # read config file
    parser.read(filename)
    # print(Path(os.path.dirname(os.path.realpath(__file__)) + '/' + filename))
    # get section, default to postgresql
    db = {}
    if parser.has_section(section):
        params = parser.items(section)
        for param in params:
            db[param[0]] = param[1]
    else:
        raise Exception(
            'Section {0} not found in the {1} file'.format(section, filename))
    return db

def detect_face(img):
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) #mtcnn expects RGB but OpenCV read BGR
    detections = face_detector.detect_faces(img_rgb)
    detection = detections[0]
    x, y, w, h = detection["box"]
    detected_face = img[int(y):int(y+h), int(x):int(x+w)]
    return detected_face

def preprocess_face(img, target_size=(112,112)):
    img = cv2.imread(img)
    img = detect_face(img)
    img = cv2.resize(img, target_size)
    img_pixels = image.img_to_array(img)
    img_pixels = np.expand_dims(img_pixels, axis = 0)
    img_pixels /= 255 #normalize input in [0, 1]
    return img_pixels

def img_to_encoding(path):
    img = preprocess_face(path)
    return model.predict(img)[0]

database = {}
arr_ = os.listdir('./images')
for i in filter(lambda x: '.jpg' in x, arr_):    
    # print(i.split('.')[0])
    name = i.split('.')[0]
    path = './images/' + i
    database[name] = img_to_encoding(path)

verification_threshhold = 4.4

def EuclideanDistance(source_representation, test_representation):
    euclidean_distance = source_representation - test_representation
    euclidean_distance = np.sum(np.multiply(euclidean_distance, euclidean_distance))
    euclidean_distance = np.sqrt(euclidean_distance)
    return euclidean_distance

def who_is_it(image_path, database):
   
    ## Step 1: Compute the target "encoding" for the image. Use img_to_encoding()
    encoding = img_to_encoding(image_path)
    status = ""
    identity = ""
    ## Step 2: Find the closest encoding ##
    
    # Initialize "min_dist" to a large value, say 100 
    min_dist = 1000
    # Loop over the database dictionary's names and encodings.
    for (name, db_enc) in database.items():
        # Compute L2 distance between the target "encoding" and the current "emb" from the database. (≈ 1 line)
        dist = EuclideanDistance(encoding, db_enc)
        # print(dist)
        # If this distance is less than the min_dist, then set min_dist to dist, and identity to name. (≈ 3 lines)
        if dist < min_dist:
            min_dist = dist
            identity = name

  
    if min_dist > verification_threshhold:
        print("Not in the database.")
        status = 'not_exists'
    else:
        print ("it's " + str(identity) + ", the distance is " + str(min_dist))
        status = 'exists'
        
    return min_dist, identity, status

class VisitorFaceRegister(BaseModel):
    file: str 
    VisitorName: str 
    VisitorID: str 
    Company: str 
    TimePlan: str 
    ReasonPlan: str 
    AppointmentCode: str 
    CompanyCode: str 

@app.post("/mobile/visitor/faceregisterpub")
def face_register_pub(
    VisitorFaceRegister: VisitorFaceRegister
    ):

    file = VisitorFaceRegister.dict()['file']
    VisitorName = VisitorFaceRegister.dict()['VisitorName']
    VisitorID = VisitorFaceRegister.dict()['VisitorID']
    Company = VisitorFaceRegister.dict()['Company']
    TimePlan = VisitorFaceRegister.dict()['TimePlan']
    ReasonPlan = VisitorFaceRegister.dict()['ReasonPlan']
    AppointmentCode = VisitorFaceRegister.dict()['AppointmentCode']
    CompanyCode = VisitorFaceRegister.dict()['CompanyCode']

    params = config()
    conn = psycopg2.connect(**params)
    cursor = conn.cursor()    

    tz = timezone('Asia/Ho_chi_Minh')
    loc_dt = tz.localize(datetime.now())
    created_date = loc_dt.strftime("%Y-%m-%d %H:%M:%S")
    snapshot_date = loc_dt.strftime("%Y-%m-%d")

    # sql_check = """
    #     select 'VISITOR' || LPAD(cast(max(visitor_id) + 1 as varchar),4,'0') visitor_code
    #     from visitor
    # """
    # df_check = pd.read_sql(sql_check, conn)
    # VisitorCode = df_check['visitor_code'].values[0]
    # VisitorID = VisitorCode

    try:        
        idcard = ""
        name = ""
        file_name = ""
        status = ""
        # sql_check = """
        #     select visitor_id, visitor_code from visitor 
        #     where is_deleted = 0
        #     and identify_card = '%s'
        #     """% (VisitorID)


        sql_check_emp ="""
            select * from employee where is_deleted=0 and company_code ='%s' and employee_code='%s'
        """%(CompanyCode, VisitorID)


        file_path = 'uploads/visitor/' + CompanyCode+'_'+ VisitorID + '/image'
        file_name = file_path + '/' + VisitorID + '-avatar.png' 
        meet_name = file_path + '/' + VisitorID + created_date + '-meetplan.png' 
        Path(file_path).mkdir(parents=True, exist_ok=True)
        img_original = base64.b64decode(file)
        img_as_np = np.frombuffer(img_original, dtype=np.uint8)
        img = cv2.imdecode(img_as_np, flags=1)
        cv2.imwrite(file_name, img)
        cv2.imwrite(meet_name, img)



        df_check_emp = pd.read_sql(sql_check_emp, conn)
        if df_check_emp.empty == True:
            sql_check = """
                select visitor_id, visitor_code from visitor 
                where is_deleted = 0 and company_code ='%s'
                and visitor_code = '%s'
                """% (CompanyCode,VisitorID)

            df_check = pd.read_sql(sql_check,conn)

            #idcard = EmpCode            
            
            # THÊM MỚI NHÂN VIÊN
            visitor_code =''

            if df_check.empty == False:
                #max_id = df_check['visitor_id'].values[0]
                visitor_code = df_check['visitor_code'].values[0]
                VisitorID = visitor_code

                status = 'success'
                
                # sql_update = """
                #     UPDATE %s SET is_deleted = 1,
                #     updated_date = '%s'
                #     WHERE identify_card = '%s'
                #     and is_deleted = 0
                # """% ('visitor',created_date, VisitorID)

                sql_update = """
                    UPDATE %s SET is_deleted = 1,
                    updated_date = '%s'
                    WHERE visitor_code = '%s'
                    and is_deleted = 0
                """% ('visitor',created_date, VisitorID)


                cursor.execute(sql_update)
                conn.commit()   

                df = pd.DataFrame([{
                    'visitor_image_path': file_name,
                    'visitor_name': VisitorName,
                    'visitor_code': visitor_code,
                    'identify_card': VisitorID,
                    'company': Company,
                    'company_code': CompanyCode,
                    'is_deleted': 0,
                    'created_date': created_date,
                    'department_code':'KHACH',
                    'appointment_code': AppointmentCode
                }])

                columns = df.columns
                tmp_df = '/home/ailab/ailab_hrai/backend-python/tmp/hraiv2/temp-visitor-{}.csv'.format(str(datetime.now().strftime("%Y%m%d%H%M%S%f")))
                df.to_csv(tmp_df, index=False, header=True)
                sql_copy = """
                    COPY %s(%s) 
                    FROM '%s' DELIMITER ',' CSV HEADER encoding 'utf-8'; 
                """% ('visitor',','.join(columns), tmp_df)
                #lưu lịch sử
                a = str(df.to_dict('records')).replace('\'','\'\'').replace(',','|').replace('\n','')
                edit_history(visitor_code,'visitor',visitor_code,'update',a,created_date,snapshot_date, CompanyCode)
                
                cursor.execute(sql_copy)
                conn.commit()

                add_visitor_manual(VisitorName,visitor_code,'0',file_name)              
                #add_person_manual(EmpName,EmpCode,'0',file_name,'0')    
            else:
                status = 'not_exists'

                sql_check2 = """
                    select visitor_id, visitor_code from visitor 
                    where is_deleted = 0 
                    and visitor_code = '%s'
                    """% (VisitorID)

                df_check2 = pd.read_sql(sql_check2,conn)
                if df_check2.empty == False:
                    sql_check = """
                        select 'VISITOR' || LPAD(cast(max(visitor_id) + 1 as varchar),5,'0') visitor_code
                        from visitor
                    """
                    df_check = pd.read_sql(sql_check, conn)
                    VisitorCode = df_check['visitor_code'].values[0]
                    VisitorID = VisitorCode
                
                df = pd.DataFrame([{
                    'visitor_image_path': file_name,
                    'visitor_name': VisitorName,
                    'identify_card': VisitorID,
                    'company': Company,
                    'company_code': CompanyCode,
                    'is_deleted': 0,                
                    'created_date': created_date,
                    'department_code':'KHACH',
                    'appointment_code': AppointmentCode
                }])

                columns = df.columns
                tmp_df = '/home/ailab/ailab_hrai/backend-python/tmp/hraiv2/temp-visitor-{}.csv'.format(str(datetime.now().strftime("%Y%m%d%H%M%S%f")))
                df.to_csv(tmp_df, index=False, header=True)
                sql_copy = """
                    COPY %s(%s) 
                    FROM '%s' DELIMITER ',' CSV HEADER encoding 'utf-8'; 
                """% ('visitor',','.join(columns), tmp_df)

                cursor.execute(sql_copy)
                conn.commit()
                sql_code = """
                select 'VISITOR' || LPAD(cast(visitor_id as varchar),5,'0') visitor_code
                from visitor
                where visitor_code is null
                order by created_date desc
                """

                df_code = pd.read_sql(sql_code,conn)
                visitor_code = df_code['visitor_code'].values[0]
                
                sql_update = """
                update visitor 
                set visitor_code = '%s'
                where visitor_code is null
                """%(visitor_code)
                
                cursor.execute(sql_update)
                conn.commit()

                #lưu lịch sử
                a = str(df.to_dict('records')).replace('\'','\'\'').replace(',','|').replace('\n','')
                edit_history(visitor_code,'visitor',visitor_code,'insert',a,created_date,snapshot_date, CompanyCode)            

                add_visitor_manual(VisitorName,visitor_code,'0',file_name)

        # THÊM MỚI LỊCH HẸN
        df = pd.DataFrame([{
            'visitor_name': VisitorName,
            'id_card': VisitorID,
            'company': Company,
            'company_code': CompanyCode,
            'plan_time': TimePlan,
            'reason': ReasonPlan,               
            'created_date': created_date,
            'snapshot_date': snapshot_date,
            'appointment_code': AppointmentCode,
            'recpush_path': meet_name
        }])

        columns = df.columns
        tmp_df = '/home/ailab/ailab_hrai/backend-python/tmp/hraiv2/temp-plan-{}.csv'.format(str(datetime.now().strftime("%Y%m%d%H%M%S%f")))
        df.to_csv(tmp_df, index=False, header=True)
        sql_copy = """
            COPY %s(%s) 
            FROM '%s' DELIMITER ',' CSV HEADER encoding 'utf-8'; 
        """% ('meet_plan',','.join(columns), tmp_df)

        #lưu lịch sử
        a = str(df.to_dict('records')).replace('\'','\'\'').replace(',','|').replace('\n','')
        edit_history(VisitorID,'meet_plan',VisitorID,'insert',a,created_date,snapshot_date, CompanyCode)        

        cursor.execute(sql_copy)
        conn.commit()   

        cursor.close()                  
        return {
            'status': status
        }
    except Exception as e:
        print(e)
        print(traceback.format_exc())
        # raise HTTPException(status_code=404, detail={"image": "Không nhận diện được gương mặt !!!"})
        return {
            'status': 'fail'
        }    

class VisitorDetail(BaseModel):
    company_code: str 
    visitor_code: str 

@app.post("/mobile/visitor/fetchdetail")
def fetch_visitor(
    VisitorDetail: VisitorDetail
    ):

    company_code = VisitorDetail.dict()['company_code']
    visitor_code = VisitorDetail.dict()['visitor_code']

    params = config()
    conn = psycopg2.connect(**params)

    sql_check = """
    select * from company where is_deleted=0 and company_code ='%s'
    """%(company_code)
    df_check = pd.read_sql(sql_check, conn)
    company_name =''
    if df_check.empty == False:
        company_name = df_check['company_name'].values[0]

    sql_visitor = """
    select 
        visitor_code,
        visitor_name,
        company
        from visitor
        where is_deleted = 0
        and visitor_code = '%s'
    union all
    select 
        employee_code visitor_code,
        employee_name visitor_name,
        '%s' company
        from employee
        where company_code ='%s' 
        and is_deleted=0
        and employee_code ='%s'
    """%(visitor_code, company_name, company_code, visitor_code)

    df_visitor = pd.read_sql(sql_visitor,conn)
    df_visitor = df_visitor.fillna('')

    response_json = df_visitor.to_dict('records')

    return response_json    


class FaceRegister(BaseModel):
    file: str
    name: str

@app.post('/mobile/faceregisterpub')
def face_detect(
    FaceRegister: FaceRegister
):

    file = FaceRegister.dict()['file']
    name = FaceRegister.dict()['name']
    tz = timezone('Asia/Ho_chi_Minh')
    loc_dt = tz.localize(datetime.now())
    created_date = loc_dt.strftime("%Y-%m-%d %H:%M:%S")
    created_date_format = loc_dt.strftime("%Y-%m-%d-%H-%M-%S")
    snapshot_date = loc_dt.strftime("%Y-%m-%d")    
    response_json = {}

    if(name in database.keys()):        
        response_json = {
            'status': "exists"
        }
    
    else:    
        avatar_path = './images'
        avatar_name = avatar_path + '/' + name + '.jpg'
        Path(avatar_path).mkdir(parents=True, exist_ok=True)
        # print(file[:20])
        img_original = base64.b64decode(file)
        img_as_np = np.frombuffer(img_original, dtype=np.uint8)
        img = cv2.imdecode(img_as_np, flags=1)
        cv2.imwrite(avatar_name, img)

        database[name] = img_to_encoding(avatar_name)                        
        
        response_json = {
            'status': 'success'
        }

    return response_json    

class FaceCheckLogin(BaseModel):
    file: str
    filecrop: str
    session: str

@app.post("/mobile/checkface_login")
def mobile_checkface_login(
    FaceCheckLogin: FaceCheckLogin
    ):

    file =  FaceCheckLogin.dict()['file']
    session =  FaceCheckLogin.dict()['session']
    filecrop = FaceCheckLogin.dict()['filecrop']
    try:
        params = config()
        conn = psycopg2.connect(**params)
        cursor = conn.cursor()   

        # print(file[:1000])

        tz = timezone('Asia/Ho_chi_Minh')
        loc_dt = tz.localize(datetime.now())
        login_date = loc_dt.strftime("%Y-%m-%d%H:%M:%S%f")
        created_date = loc_dt.strftime("%Y-%m-%d %H:%M:%S")
        snapshot_date = loc_dt.strftime("%Y-%m-%d")

        img_original = base64.b64decode(file)
        img_as_np = np.frombuffer(img_original, dtype=np.uint8)
        img = cv2.imdecode(img_as_np, flags=1)
        # print(file_path)                

        image = img
        start = time.time()

        # Flip the image horizontally for a later selfie-view display
        # Also convert the color space from BGR to RGB
        image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)

        # To improve performance
        image.flags.writeable = False

        # Get the result
        results = face_mesh.process(image)

        # To improve performance
        image.flags.writeable = True

        # Convert the color space from RGB to BGR
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        img_h, img_w, img_c = image.shape
        face_3d = []
        face_2d = []
        text = ""

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                for idx, lm in enumerate(face_landmarks.landmark):
                    if idx == 33 or idx == 263 or idx == 1 or idx == 61 or idx == 291 or idx == 199:
                        if idx == 1:
                            nose_2d = (lm.x * img_w, lm.y * img_h)
                            nose_3d = (lm.x * img_w, lm.y * img_h, lm.z * 3000)

                        x, y = int(lm.x * img_w), int(lm.y * img_h)

                        # Get the 2D Coordinates
                        face_2d.append([x, y])

                        # Get the 3D Coordinates
                        face_3d.append([x, y, lm.z])       

                # Convert it to the NumPy array
                face_2d = np.array(face_2d, dtype=np.float64)

                # Convert it to the NumPy array
                face_3d = np.array(face_3d, dtype=np.float64)

                # The camera matrix
                focal_length = 1 * img_w

                cam_matrix = np.array([ [focal_length, 0, img_h / 2],
                                        [0, focal_length, img_w / 2],
                                        [0, 0, 1]])

                # The distortion parameters
                dist_matrix = np.zeros((4, 1), dtype=np.float64)

                # Solve PnP
                success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_matrix)

                # Get rotational matrix
                rmat, jac = cv2.Rodrigues(rot_vec)

                # Get angles
                angles, mtxR, mtxQ, Qx, Qy, Qz = cv2.RQDecomp3x3(rmat)

                # Get the y rotation degree
                x = angles[0] * 360
                y = angles[1] * 360
                z = angles[2] * 360


                if y < -10:
                    text = "Not valid Yaw angle"
                elif y > 10:
                    text = "Not valid Yaw angle"
                elif x < -10:
                    text = "Not valid Roll angle"
                elif x > 10:
                    text = "Not valid Roll angle"
                # elif z < -10:
                #     text = "Not valid Roll angle"
                # elif z > 10:
                #     text = "Not valid Roll angle"
                else: 
                    text = "Valid"

                # Display the nose direction
        #         nose_3d_projection, jacobian = cv2.projectPoints(nose_3d, rot_vec, trans_vec, cam_matrix, dist_matrix)

        #         p1 = (int(nose_2d[0]), int(nose_2d[1]))
        #         p2 = (int(nose_2d[0] + y * 10) , int(nose_2d[1] - x * 10))

        #         cv2.line(image, p1, p2, (255, 0, 0), 3)

                # Add the text on the image
                cv2.putText(image, text, (20, 150), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(image, "Roll Angle: " + str(np.round(x,2)), (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                cv2.putText(image, "Yaw Angle: " + str(np.round(y,2)), (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                # cv2.putText(image, "Roll Angle: " + str(np.round(z,2)), (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)


            end = time.time()
            totalTime = end - start

            fps = 1 / totalTime
            #print("FPS: ", fps)

            # cv2.putText(image, f'FPS: {int(fps)}', (5,100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)            
            mp_drawing.draw_landmarks(
                        image=image,
                        landmark_list=face_landmarks,
                        connections=mp_face_mesh.FACEMESH_CONTOURS,
                        landmark_drawing_spec=drawing_spec,
                        connection_drawing_spec=drawing_spec)             
       

        file_path = 'uploads/employee/CheckLogin/login'
        file_name = file_path + '/' + (login_date.replace(' ','-')).replace(':','-') + '.png'
        file_name_2 = file_path + '/' + (login_date.replace(' ','-')).replace(':','-') + '_angle.png'
        Path(file_path).mkdir(parents=True, exist_ok=True)
        cv2.imwrite(file_name, img)

        Path(file_name_2).mkdir(parents=True, exist_ok=True)        
        cv2.imwrite(file_name, image)

        retval, buffer = cv2.imencode('.png', image)
        png_as_text = base64.b64encode(buffer)  

        print(text)
        if(text == 'Valid'):
            min_dist, identity, status = who_is_it(file_name, database)
            print(min_dist, identity, status)
            response_json = {}

            if status == 'exists':

                df_checkin = pd.DataFrame([{
                    'name': str(identity),
                    'min_dist': str(min_dist),
                    'status': 'allow',    
                    'time': created_date,         
                    'record_image': str(file_name),
                    'created_date': snapshot_date}])     

                columns = df_checkin.columns
                tmp_df = '/tmp_dev/checkin.csv'
                df_checkin.to_csv(tmp_df, index=False, header=True)
                sql_copy = """
                    COPY %s(%s) 
                    FROM '%s' DELIMITER ',' CSV HEADER encoding 'utf-8'; 
                """% ('device_faceserver_recpush',','.join(columns), tmp_df)

                cursor.execute(sql_copy)
                conn.commit()     
                return {
                    'status': 'valid',
                    'file': filecrop,
                    'name': str(identity)
                }

            else: 
                return {
                    'status': 'not_exists',
                    'file': filecrop,    
                }

        else:
            return {
                'status': 'invalid',
                'file': png_as_text,
                'text': text
            }                 
                        
    except Exception as e:
        # raise HTTPException(status_code=404, detail={"image": "Không nhận diện được gương mặt !!!"})
        print(traceback.format_exc())
        return {
            'status': 'fail'
        }  

     
    except Exception as e:
        # raise HTTPException(status_code=404, detail={"image": "Không nhận diện được gương mặt !!!"})
        print(traceback.format_exc())
        return {
            'status': 'fail'
        }

class FaceCheckIn(BaseModel):
    file: str
    filecrop: str
    EmpCode: str
    lat: str
    lng: str
    # timesheet_month: str

@app.post("/mobile/checkface")
def mobile_checkface(
        FaceCheckIn:FaceCheckIn
    ):

    file = FaceCheckIn.dict()['file']
    filecrop = FaceCheckIn.dict()['filecrop']
    EmpCode = FaceCheckIn.dict()['EmpCode']
    lat = FaceCheckIn.dict()['lat']
    lng = FaceCheckIn.dict()['lng']
    # timesheet_month =  FaceCheckIn.dict()['timesheet_month']
    timesheet_month = '2023-09'

    try:
        print(str(lat)+'-'+str(lng))
        # print(file[:50])
        params = config()
        conn = psycopg2.connect(**params)
        cursor = conn.cursor()     

        tz = timezone('Asia/Ho_chi_Minh')
        loc_dt = tz.localize(datetime.now())
        created_date = loc_dt.strftime("%Y-%m-%d %H:%M:%S")
        snapshot_date = loc_dt.strftime("%Y-%m-%d")

        img_original = base64.b64decode(file)
        img_as_np = np.frombuffer(img_original, dtype=np.uint8)
        img = cv2.imdecode(img_as_np, flags=1)
        
        # width = 336
        # height = 336 # keep original height
        # dim = (width, height)
        # img = cv2.resize(img_ori, dim)
        # print(file_path)   

        image = img
        start = time.time()

        # Flip the image horizontally for a later selfie-view display
        # Also convert the color space from BGR to RGB
        image = cv2.cvtColor(cv2.flip(image, 1), cv2.COLOR_BGR2RGB)

        # To improve performance
        image.flags.writeable = False

        # Get the result
        results = face_mesh.process(image)

        # To improve performance
        image.flags.writeable = True

        # Convert the color space from RGB to BGR
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        img_h, img_w, img_c = image.shape
        face_3d = []
        face_2d = []
        text = ""

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                for idx, lm in enumerate(face_landmarks.landmark):
                    if idx == 33 or idx == 263 or idx == 1 or idx == 61 or idx == 291 or idx == 199:
                        if idx == 1:
                            nose_2d = (lm.x * img_w, lm.y * img_h)
                            nose_3d = (lm.x * img_w, lm.y * img_h, lm.z * 3000)

                        x, y = int(lm.x * img_w), int(lm.y * img_h)

                        # Get the 2D Coordinates
                        face_2d.append([x, y])

                        # Get the 3D Coordinates
                        face_3d.append([x, y, lm.z])       

                # Convert it to the NumPy array
                face_2d = np.array(face_2d, dtype=np.float64)

                # Convert it to the NumPy array
                face_3d = np.array(face_3d, dtype=np.float64)

                # The camera matrix
                focal_length = 1 * img_w

                cam_matrix = np.array([ [focal_length, 0, img_h / 2],
                                        [0, focal_length, img_w / 2],
                                        [0, 0, 1]])

                # The distortion parameters
                dist_matrix = np.zeros((4, 1), dtype=np.float64)

                # Solve PnP
                success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_matrix)

                # Get rotational matrix
                rmat, jac = cv2.Rodrigues(rot_vec)

                # Get angles
                angles, mtxR, mtxQ, Qx, Qy, Qz = cv2.RQDecomp3x3(rmat)

                # Get the y rotation degree
                x = angles[0] * 360
                y = angles[1] * 360
                z = angles[2] * 360


                               # See where the user's head tilting
                if y < -10:
                    text = "Not valid Yaw angle"
                elif y > 10:
                    text = "Not valid Yaw angle"
                
                elif x < -10:
                    text = "Not valid Roll angle"
                elif x > 10:
                    text = "Not valid Roll angle"
                # elif z < -10:
                #     text = "Not valid Roll angle"
                # elif z > 10:
                    # text = "Not valid Roll angle"
                else: 
                    text = "Valid"

                # Display the nose direction
        #         nose_3d_projection, jacobian = cv2.projectPoints(nose_3d, rot_vec, trans_vec, cam_matrix, dist_matrix)

        #         p1 = (int(nose_2d[0]), int(nose_2d[1]))
        #         p2 = (int(nose_2d[0] + y * 10) , int(nose_2d[1] - x * 10))

        #         cv2.line(image, p1, p2, (255, 0, 0), 3)

                # Add the text on the image
                print(str(np.round(x,2)))
                cv2.putText(image, text, (20, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
                cv2.putText(image, "Roll Angle: " + str(np.round(x,2)), (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                cv2.putText(image, "Yaw Angle: " + str(np.round(y,2)), (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
                # cv2.putText(image, "Piltch Angle: " + str(np.round(z,2)), (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)


            end = time.time()
            totalTime = end - start

            fps = 1 / totalTime
            #print("FPS: ", fps)

            # cv2.putText(image, f'FPS: {int(fps)}', (5,100), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)            
            mp_drawing.draw_landmarks(
                        image=image,
                        landmark_list=face_landmarks,
                        connections=mp_face_mesh.FACEMESH_CONTOURS,
                        landmark_drawing_spec=drawing_spec,
                        connection_drawing_spec=drawing_spec)             

        file_path = 'uploads/employee/' + EmpCode + '/recpush'
        file_name = file_path + '/' + (created_date.replace(' ','-')).replace(':','-') + '.png'
        file_name_2 = file_path + '/' + (created_date.replace(' ','-')).replace(':','-') + '_angle.png'
        Path(file_path).mkdir(parents=True, exist_ok=True)
        cv2.imwrite(file_name, img)
        cv2.imwrite(file_name_2, image)
        
        retval, buffer = cv2.imencode('.png', image)
        png_as_text = base64.b64encode(buffer)    

        print(text)
        if(text == 'Valid'):
            min_dist, identity, status = who_is_it(file_name, database)
            print(min_dist, identity, status)
            response_json = {}

            if status == 'exists':

                df_checkin = pd.DataFrame([{
                    'name': str(identity),
                    'min_dist': str(min_dist),
                    'status': 'allow',    
                    'time': created_date,         
                    'record_image': str(file_name),
                    'created_date': snapshot_date}])     

                columns = df_checkin.columns
                tmp_df = '/tmp_dev/checkin.csv'
                df_checkin.to_csv(tmp_df, index=False, header=True)
                sql_copy = """
                    COPY %s(%s) 
                    FROM '%s' DELIMITER ',' CSV HEADER encoding 'utf-8'; 
                """% ('device_faceserver_recpush',','.join(columns), tmp_df)

                cursor.execute(sql_copy)
                conn.commit()     
                
                month = timesheet_month.split('-')[1]
                year = timesheet_month.split('-')[0]

                list_date = monthrange(int(year), int(month))  
                list_date = range(1, list_date[1]+1)
                list_dates=[]
                for i in list_date:
                    list_dates.append(timesheet_month+'-'+str(i).zfill(2))

                # sql_call = """
                #     insert into timesheet_tmp_allday
                #     select date_actual snapshot_date, '%s' employee_code
                #     from d_date 
                #     where date_actual between '%s' and '%s'
                # """%(str(identity), list_dates[0], list_dates[-1])

                # sql_delete = """
                #     delete from timesheet_tmp_allday
                #     where snapshot_date between '%s' and '%s'
                #     and employee_code ='%s'
                # """%(list_dates[0], list_dates[-1], str(identity))

                # cursor.execute(sql_delete)
                # cursor.execute(sql_call)
                # conn.commit()

                tz = timezone('Asia/Ho_chi_Minh')
                loc_dt = tz.localize(datetime.now())
                snapshot_date = loc_dt.strftime("%Y-%m-%d")
                if snapshot_date > list_dates[-1]:
                    snapshot_date = list_dates[-1]

                sql_assign ="""
                select name idcard, 
                time::date working_date,
                 time::date snapshot_date,
                 time::time time_enter, 
                 (time::timestamp + '08:00:00'::time)::time time_leave,
                 '08:00:00'::time total_hours from device_faceserver_recpush
                 where 1=1
                 and name = '%s'
                 and time::date between '%s' and '%s'
                 order by time::timestamp desc                
                """% (str(identity), list_dates[0], snapshot_date)   
                df_merge = pd.read_sql(sql_assign,conn)

                df_merge = df_merge.fillna('')
                print(df_merge)

                response_json = df_merge.to_dict('records')

                cursor.close()
                
                return {
                    'status': 'valid',
                    'file': filecrop,
                    'name': str(identity),
                    'data': response_json
                }

            else: 
                return {
                    'status': 'not_exists'
                }

        else:
            return {
                'status': 'invalid',
                'file': png_as_text,
                'text': text
            }                 
                        
    except Exception as e:
        # raise HTTPException(status_code=404, detail={"image": "Không nhận diện được gương mặt !!!"})
        print(traceback.format_exc())
        return {
            'status': 'fail'
        }

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5012,
        ssl_keyfile="cert/privkey1.pem",
        ssl_certfile="cert/cert1.pem",
        )
