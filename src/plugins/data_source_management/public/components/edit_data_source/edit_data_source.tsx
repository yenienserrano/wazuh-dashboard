/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RouteComponentProps, withRouter } from 'react-router-dom';
import React, { useState } from 'react';
import { useEffectOnce } from 'react-use';
import { EuiSpacer } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import {
  DataSourceManagementContext,
  DataSourceManagementToastMessageItem,
  DataSourceTableItem,
} from '../../types';
import {
  deleteDataSourceById,
  getDataSourceById,
  getDataSources,
  testConnection,
  updateDataSourceById,
  setFirstDataSourceAsDefault,
  getDefaultDataSourceId,
} from '../utils';
import { getEditBreadcrumbs } from '../breadcrumbs';
import { EditDataSourceForm } from './components/edit_form/edit_data_source_form';
import { LoadingMask } from '../loading_mask';
import { AuthType, DataSourceAttributes } from '../../types';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../constants';

const defaultDataSource: DataSourceAttributes = {
  title: '',
  description: '',
  endpoint: '',
  auth: {
    type: AuthType.NoAuth,
    credentials: undefined,
  },
};

export const EditDataSource: React.FunctionComponent<RouteComponentProps<{ id: string }>> = (
  props: RouteComponentProps<{ id: string }>
) => {
  /* Initialization */
  const {
    uiSettings,
    savedObjects,
    setBreadcrumbs,
    http,
    notifications: { toasts },
    application,
    navigation,
  } = useOpenSearchDashboards<DataSourceManagementContext>().services;
  const dataSourceID: string = props.match.params.id;

  /* State Variables */
  const [dataSource, setDataSource] = useState<DataSourceAttributes>(defaultDataSource);
  const [existingDatasourceNamesList, setExistingDatasourceNamesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const useNewUX = uiSettings.get('home:useNewHomePage');

  /* Fetch data source by id*/
  useEffectOnce(() => {
    (async function () {
      await fetchDataSourceDetailsByID();
    })();
  });

  const fetchDataSourceDetailsByID = async () => {
    setIsLoading(true);
    try {
      const fetchDataSourceById = await getDataSourceById(dataSourceID, savedObjects.client);
      const listOfDataSources: DataSourceTableItem[] = await getDataSources(savedObjects.client);
      if (fetchDataSourceById) {
        setDataSource(fetchDataSourceById);
        setBreadcrumbs(getEditBreadcrumbs(fetchDataSourceById));
      }
      if (Array.isArray(listOfDataSources) && listOfDataSources.length) {
        setExistingDatasourceNamesList(
          listOfDataSources.map((datasource) => datasource.title?.toLowerCase())
        );
      }
    } catch (e) {
      setDataSource(defaultDataSource);
      handleDisplayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.fetchDataSourceFailMsg', {
          defaultMessage: 'Unable to find the Data Source.',
        }),
      });
      props.history.push('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async () => {
    return await uiSettings.set(DEFAULT_DATA_SOURCE_UI_SETTINGS_ID, dataSourceID);
  };

  const isDefaultDataSource = getDefaultDataSourceId(uiSettings) === dataSourceID;

  /* Handle submit - create data source*/
  const handleSubmit = async (attributes: DataSourceAttributes) => {
    await updateDataSourceById(savedObjects.client, dataSourceID, attributes);
    await fetchDataSourceDetailsByID();
  };

  const handleDisplayToastMessage = ({
    message,
    success,
  }: DataSourceManagementToastMessageItem) => {
    if (success) {
      toasts.addSuccess(message);
    } else {
      toasts.addWarning(message);
    }
  };

  /* Handle delete - data source*/
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteDataSourceById(props.match.params.id, savedObjects.client);

      // If deleted datasource is the default datasource, then set the first existing
      // datasource as default datasource.
      setDefaultDataSource();
      props.history.push('');
    } catch (e) {
      setIsLoading(false);
      handleDisplayToastMessage({
        message: i18n.translate('dataSourcesManagement.editDataSource.deleteDataSourceFailMsg', {
          defaultMessage:
            'Unable to delete the Data Source due to some errors. Please try it again.',
        }),
      });
    }
  };

  const setDefaultDataSource = async () => {
    try {
      if (getDefaultDataSourceId(uiSettings) === dataSourceID) {
        await setFirstDataSourceAsDefault(savedObjects.client, uiSettings, true);
      }
    } catch (e) {
      setIsLoading(false);
      handleDisplayToastMessage({
        message: i18n.translate(
          'dataSourcesManagement.editDataSource.setDefaultDataSourceFailMsg',
          {
            defaultMessage:
              'Unable to find a default datasource. Please set a new default datasource.',
          }
        ),
      });
    }
  };

  /* Handle Test connection */
  const handleTestConnection = async (attributes: DataSourceAttributes) => {
    await testConnection(http, attributes, dataSourceID);
  };

  /* Render the edit wizard */
  const renderContent = () => {
    if (!isLoading && (!dataSource || !dataSource.id)) {
      return <h1 data-test-subj="dataSourceNotFound">Data Source not found!</h1>;
    }
    return (
      <>
        {dataSource && dataSource.endpoint ? (
          <EditDataSourceForm
            navigation={navigation}
            application={application}
            useNewUX={useNewUX}
            existingDataSource={dataSource}
            existingDatasourceNamesList={existingDatasourceNamesList}
            isDefault={isDefaultDataSource}
            onDeleteDataSource={handleDelete}
            onSetDefaultDataSource={handleSetDefault}
            handleSubmit={handleSubmit}
            displayToastMessage={handleDisplayToastMessage}
            handleTestConnection={handleTestConnection}
            canManageDataSource={!!application.capabilities?.dataSource?.canManage}
          />
        ) : null}
        {isLoading || !dataSource?.endpoint ? <LoadingMask /> : null}
      </>
    );
  };

  if (!isLoading && !dataSource?.endpoint) {
    return (
      <h1>
        {
          <FormattedMessage
            id="dataSourcesManagement.editDataSource.dataSourceNotFound"
            defaultMessage="Data Source not found!"
          />
        }
      </h1>
    );
  }

  return (
    <>
      <EuiSpacer size="m" />
      {renderContent()}
    </>
  );
};

export const EditDataSourceWithRouter = withRouter(EditDataSource);
