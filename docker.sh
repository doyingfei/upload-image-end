docker build --platform linux/amd64 -t my-express-app .
docker save -o my-express-app.tar my-express-app

# 服务器端操作
#docker ps
# docker rm 容器id/容器name
# docker rmi my-express-app
# docker load -i /www/docker/my-express-app.tar
# docker run -d -p 3000:3000 --name my-express-app my-express-app