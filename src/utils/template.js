export const deploymentConfig = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'init-dev-container',
    namespace: 'testproj',
  },
  spec: {
    replicas: 1,
    selector: {
      matchLabels: {
        app: 'ssh-app1',
      },
    },
    template: {
      metadata: {
        labels: {
          app: 'ssh-app1',
        },
      },
      spec: {
        containers: [
          {
            name: 'ssh-container1',
            image: 'ubuntu',
            command: [
              '/bin/bash',
              '-c',
              "echo 'root:123456' | chpasswd && useradd -m -s /bin/bash ubuntu && echo 'ubuntu:123456' | chpasswd && apt-get update && apt-get install -y openssh-server sudo && usermod -aG sudo ubuntu && service ssh start && tail -f /dev/null",
            ],
            stdin: true,
            tty: true,
          },
        ],
      },
    },
  },
}

export const serviceConfig = {
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'ssh-service',
    namespace: 'testproj',
  },
  spec: {
    selector: {
      app: 'ssh-app1',
    },
    type: 'NodePort',
    ports: [
      {
        name: 'ssh',
        port: 22,
        targetPort: 22,
      },
    ],
  },
}
