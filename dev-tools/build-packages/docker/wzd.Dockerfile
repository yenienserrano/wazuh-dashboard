FROM ubuntu:jammy AS builder

ARG INSTALL_DIR=/usr/share/wazuh-dashboard
ARG PACKAGE_NAME

# Update and install dependencies
RUN apt-get update && apt install curl libcap2-bin xz-utils unzip -y

# Create Install dir
RUN mkdir -p $INSTALL_DIR
RUN mkdir -p /tmp

# Download and extract wazuh-dashboard
COPY ./$PACKAGE_NAME /tmp
RUN unzip /tmp/$PACKAGE_NAME -d /tmp/tar/
RUN tar -xf /tmp/tar/$(ls /tmp/tar) --directory  $INSTALL_DIR --strip-components=1

# Generate certificates
COPY config/config.sh .
COPY config/config.yml /
RUN bash config.sh

# Create and set permissions to data directories
RUN mkdir -p $INSTALL_DIR/data/wazuh && chown -R 101:101 $INSTALL_DIR/data/wazuh && chmod -R 775 $INSTALL_DIR/data/wazuh
RUN mkdir -p $INSTALL_DIR/data/wazuh/config && chown -R 101:101 $INSTALL_DIR/data/wazuh/config && chmod -R 775 $INSTALL_DIR/data/wazuh/config
RUN mkdir -p $INSTALL_DIR/data/wazuh/logs && chown -R 101:101 $INSTALL_DIR/data/wazuh/logs && chmod -R 775 $INSTALL_DIR/data/wazuh/logs

# Copy and set permissions to config files
COPY config/opensearch_dashboards.yml $INSTALL_DIR/config/
COPY config/wazuh.yml $INSTALL_DIR/data/wazuh/config/
RUN chown 101:101 $INSTALL_DIR/config/opensearch_dashboards.yml && chmod 664 $INSTALL_DIR/config/opensearch_dashboards.yml


################################################################################
# Build stage 1 (the current Wazuh dashboard image):
#
# Copy wazuh-dashboard from stage 0
# Add entrypoint
# Add wazuh_app_config
################################################################################
FROM ubuntu:jammy

# Set environment variables
ENV USER="wazuh-dashboard" \
  GROUP="wazuh-dashboard" \
  NAME="wazuh-dashboard" \
  INSTALL_DIR="/usr/share/wazuh-dashboard"

# Set Wazuh app variables
ENV PATTERN="" \
  CHECKS_PATTERN="" \
  CHECKS_TEMPLATE="" \
  CHECKS_API="" \
  CHECKS_SETUP="" \
  APP_TIMEOUT="" \
  API_SELECTOR="" \
  IP_SELECTOR="" \
  IP_IGNORE="" \
  WAZUH_MONITORING_ENABLED="" \
  WAZUH_MONITORING_FREQUENCY="" \
  WAZUH_MONITORING_SHARDS="" \
  WAZUH_MONITORING_REPLICAS=""

# Create wazuh-dashboard user and group
RUN getent group $GROUP || groupadd -r -g 1000 $GROUP
RUN useradd --system \
  --uid 1000 \
  --no-create-home \
  --home-dir $INSTALL_DIR \
  --gid $GROUP \
  --shell /sbin/nologin \
  --comment "$USER user" \
  $USER

# Copy and set permissions to scripts
COPY config/entrypoint.sh /
COPY config/wazuh_app_config.sh /
RUN chmod 700 /entrypoint.sh
RUN chmod 700 /wazuh_app_config.sh
RUN chown 1000:1000 /*.sh

# Copy Install dir from builder to current image
COPY --from=builder --chown=1000:1000 $INSTALL_DIR $INSTALL_DIR

# Create custom directory
RUN mkdir -p /usr/share/wazuh-dashboard/plugins/wazuh/public/assets/custom
RUN chown 1000:1000 /usr/share/wazuh-dashboard/plugins/wazuh/public/assets/custom

# Set workdir and user
WORKDIR $INSTALL_DIR
USER wazuh-dashboard

# Services ports
EXPOSE 443

ENTRYPOINT [ "/entrypoint.sh" ]
