import face_recognition
import cv2
import os
import numpy as np

# This is a demo of running face recognition on live video from your webcam. It's a little more complicated than the
# other example, but it includes some basic performance tweaks to make things run a lot faster:
#   1. Process each video frame at 1/4 resolution (though still display it at full resolution)
#   2. Only detect faces in every other frame of video.

# PLEASE NOTE: This example requires OpenCV (the `cv2` library) to be installed only to read from your webcam.
# OpenCV is *not* required to use the face_recognition library. It's only required if you want to run this
# specific demo. If you have trouble installing it, try any of the other demos that don't require it instead.

# Get a reference to webcam #0 (the default one)

# video_capture = cv2.VideoCapture(0)

# # Load a sample picture and learn how to recognize it.
# obama_image = face_recognition.load_image_file("obama.jpg")
# obama_face_encoding = face_recognition.face_encodings(obama_image)[0]

# # Load a second sample picture and learn how to recognize it.
# biden_image = face_recognition.load_image_file("biden.jpg")
# biden_face_encoding = face_recognition.face_encodings(biden_image)[0]

# Load a second sample picture and learn how to recognize it.
# fangchao_image = face_recognition.load_image_file("fangchao.jpg")
# fangchao_face_encoding = face_recognition.face_encodings(fangchao_image)[0]

face_path = "./main/face/"

def load_encoding(img_file_name):
    face_image = face_recognition.load_image_file(face_path + img_file_name)
    encoding = face_recognition.face_encodings(face_image)
    if encoding:
        known_face_names.append(img_file_name.split("_")[0])
        known_face_encodings.append(encoding[0])
    return 

known_face_names = [
    # "Barack Obama",
    # "Joe Biden",
]

# Create arrays of known face encodings and their names
known_face_encodings = [
    # obama_face_encoding,
    # biden_face_encoding,
    # load_encoding("FangchaoDong_29010610.jfif"),
    # load_encoding("GeLi_29025383.jfif"),
    # load_encoding("HanruiShen_29031672.jfif"),
    # load_encoding("RongjiSu_29006678.jfif"),
    # load_encoding("RuotongQi_29031893.jfif"),
]

def get_face_filenames(dir_path):
    filenames = []
    for filename in os.listdir(dir_path):
        if not filename.endswith(".csv"):
            filenames.append(filename)
    return filenames

cache_face_csv_file_name = os.path.abspath(face_path) + '/cached_face.csv'

def save_face_encoding_to_csv():
    matrix = []
    for face_name, face_encoding in zip(known_face_names, known_face_encodings):
        face_list = face_encoding.tolist()
        face_list.insert(0, face_name)
        matrix.append(face_list)
    np.savetxt(cache_face_csv_file_name, matrix, delimiter=',', fmt='%s')

def load_face_encoding_from_csv():
    global known_face_names
    global known_face_encodings
    matrix = np.genfromtxt(cache_face_csv_file_name, delimiter=',', dtype=None, encoding='ascii')
    
    known_face_names = []
    known_face_encodings = []
    for row in matrix:
        known_face_names.append(row[0]) # .decode('utf-8')
        data = [row[i] for i in range(1, len(row))]
        known_face_encodings.append(np.array(data, dtype=float))

def load_face_from_img():
    face_filenames = get_face_filenames(face_path)
    for face_filename in face_filenames:
        load_encoding(face_filename)
    
def load_face():
    if os.path.exists(cache_face_csv_file_name):
        load_face_encoding_from_csv()
    else:
        load_face_from_img()
        save_face_encoding_to_csv()

load_face()

def detectFace(frame, process_this_frame = True):
    face_locations = []
    face_encodings = []
    face_names = []
    # Only process every other frame of video to save time
    if process_this_frame:
        # Resize frame of video to 1/4 size for faster face recognition processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

        # Convert the image from BGR color (which OpenCV uses) to RGB color (which face_recognition uses)
        rgb_small_frame = small_frame[:, :, ::-1]


        # Find all the faces and face encodings in the current frame of video
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

        face_names = []
        face_distances = []
        for face_encoding in face_encodings:
            # See if the face is a match for the known face(s)
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
            name = "Unknown"
            face_distance = None

            # # If a match was found in known_face_encodings, just use the first one.
            # if True in matches:
            #     first_match_index = matches.index(True)
            #     name = known_face_names[first_match_index]

            # Or instead, use the known face with the smallest distance to the new face
            all_face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
            best_match_index = np.argmin(all_face_distances)
            if matches[best_match_index]:
                name = known_face_names[best_match_index]
                face_distance = all_face_distances[best_match_index]

            face_names.append(name)
            face_distances.append(face_distance)
    # Display the results
    first_name = ""
    for (top, right, bottom, left), name, face_distance in zip(face_locations, face_names, face_distances):
        # Scale back up face locations since the frame we detected in was scaled to 1/4 size
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        # Draw a box around the face
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)

        # Draw a label with a name below the face
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
        font = cv2.FONT_HERSHEY_DUPLEX
        cv2.putText(frame, "%s %f" % (name, face_distance or 0), (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)

        if first_name == "":
            first_name = name
    return first_name, frame

def run():
    # Initialize some variables
    face_locations = []
    face_encodings = []
    face_names = []

    process_this_frame = True
    video_capture = cv2.VideoCapture(0)

    while True:
        # Grab a single frame of video
        ret, frame = video_capture.read()
        detectFace(frame, True)
        process_this_frame = not process_this_frame

        # Display the resulting image
        cv2.imshow('Video', frame)

        # Hit 'q' on the keyboard to quit!
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Release handle to the webcam
    video_capture.release()
    cv2.destroyAllWindows()

# run()