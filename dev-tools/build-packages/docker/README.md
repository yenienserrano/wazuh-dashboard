# Images

Generation of Wazuh dashboard docker images

### Prerequisites

You must already have the final Wazuh dashboard package. 

You can run it from the GitHub actions to generate the tar package.

Download the zip file that generates the action and place it in the `*/wazuh-dashboard/dev-tools/build-packages/docker/` folder.(If you have generated it locally, it generates a zip of the tar.gz file)

### Image generation

To build an image, use the docker build command like: 

Use the `--build-arg` flag to specify the package name.

For example, to build the image for Wazuh dashboard 4.9.0.
You must have the file wazuh-dashboard-4.9.0-00-linux-x64.tar.gz.zip in the specified path and specify it in the command with parameter PACKAGE_NAME.

```bash
docker build -f ./wzd.Dockerfile . --build-arg PACKAGE_PATH=wazuh-dashboard-4.9.0-00-linux-x64.tar.gz.zip -t wazuh-dashboard:4.9.0
```