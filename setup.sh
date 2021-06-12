echo "create storage file for backend"
cd backend
mkdir instance
cd app
mkdir static
mkdir static/img
mkdir static/img/tmp
cd ../../

echo "install packages for backend"
cd backend
pip install -r requirements.txt
cd ../

echo "install node_modules for frontend"
cd frontend
npm i