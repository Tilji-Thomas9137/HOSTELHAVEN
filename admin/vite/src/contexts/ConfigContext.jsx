import PropTypes from 'prop-types';

import { createContext } from 'react';

// @project
import defaultConfig from '@/config';
import useLocalStorage from '@/hooks/useLocalStorage';

// @initial
const initialState = { ...defaultConfig };

/***************************  CONFIG - CONTEXT & PROVIDER  ***************************/

const ConfigContext = createContext(initialState);

function ConfigProvider({ children }) {
  const [config, setConfig] = useLocalStorage('hostelhaven-react-mui-admin-vite', initialState);

  const updateConfig = (newConfig) => {
    setConfig((prevConfig) => ({ ...prevConfig, ...newConfig }));
  };

  return <ConfigContext value={{ ...config, updateConfig }}>{children}</ConfigContext>;
}

export { ConfigProvider, ConfigContext };

ConfigProvider.propTypes = { children: PropTypes.any };
