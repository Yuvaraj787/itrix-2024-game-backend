module.exports = {
  apps: [
    {
      name: "your_app_name",
      script: "/home/azureuser/.nvm/versions/node/v18.13.0/bin/ts-node",
      args: "index.ts",
      autorestart: true,
      watch: false,
      exec_mode: "fork",
      interpreter: "/bin/bash",
    },
  ],
};

