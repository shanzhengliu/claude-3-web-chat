
### Introduction  
This is a template project used to create embed project with React(frontend) and Go(backend).  

### React  
This project tech stack are  
1. `vite` build  
2. `tailwindCSS` css framework 
3. `swr` data fetching hooks  
4. `mockjs` backend mock   
5. `axios`  data fectching library  
you need to run commend `cd frontend-react` to step into frontend project and run the command.
## command list  
1. `pnpm install`: dependency install
2. `pnpm dev`: api will access real backend. and updated the value in .env.developemtn, default is `http://localhost:8080`, which is local backend project.  
3. `pnpm mock`: use the mock data as backend. you can create new mock in folder `mock`.  
4. `pnpm backend`, will run the go backend appliction locally.

### backend project.
This is the project for create api. at the moment is pure and we are 
using `github.com/gorilla/mux` as http web client.  

1. the defualt cross origin is `*`, and you can set up in the environment variable `ORIGIN`  
2. the default port is `8080`, you can set up in environment variable `PORT`

### Docker build.
You can easily build the project including frontend and backend via command `Docker build .t {imageName}`. Following steps will run in the docker build.  
1. build front end project in the step 1 in a stageBaseImage
2. copy step 1 dist file to the backend-go/ui folder. and build go project.  
3. copy go binary file from step 2 into a alpha image, and expose 8080 port. and run binary file. 