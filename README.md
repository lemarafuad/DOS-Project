**How to Running the project:**

• Building docker image: ‘**docker build -t nodejs-sqlite3 .**’. 

• Creating common network to allow services to communicate: ‘**docker network create project-network**’. 

• Running docker container for frontend server at port 3000 and hostname=frontend: ‘**docker run --network=project-network --name=frontend -p 3000:3000 -it nodejs-sqlite3**’.  

• Running docker container for catalog server at port 5000 and hostname=catalog: ‘**docker run --network=project-network --name=catalog -p 5000:5000 -it nodejs-sqlite3**’. 

• Running docker container for order server at port 4000 and hostname=order : ‘**docker run --network=project-network --name=order -p 4000:4000 -it nodejs-sqlite3**’.

• Inside frontend container: ‘**node frontend.js**’. 

• Inside catalog container: ‘**node Database.js**’ → this for creating the catalog table and insert data. Then ‘**node catalog.js**’. 

• Inside order container: ‘**node order.js**’.


