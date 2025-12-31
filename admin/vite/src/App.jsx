import { RouterProvider } from 'react-router-dom';

// @project
import Notistack from '@/components/third-party/Notistack';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { AuthProvider } from '@/contexts/AuthContext';

import router from '@/routes';
import ThemeCustomization from '@/themes';

function App() {
  return (
    <>
      <ConfigProvider>
        <AuthProvider>
          <ThemeCustomization>
            <Notistack>
              <RouterProvider router={router} />
            </Notistack>
          </ThemeCustomization>
        </AuthProvider>
      </ConfigProvider>
    </>
  );
}

export default App;
