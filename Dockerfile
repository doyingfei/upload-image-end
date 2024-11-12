# 使用官方 Node.js 镜像（可以选择你需要的版本）
FROM node:23

# 设置容器内的工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json 文件到容器
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 将当前目录的文件复制到容器
COPY . .

# 暴露项目所用的端口（假设你在 index.js 中使用的是 3000 端口）
EXPOSE 3000

# 启动 Express 应用，命令为 node index.js
CMD ["node", "index.js"]
