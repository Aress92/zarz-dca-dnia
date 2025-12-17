import { AppProvider } from '@/app/AppContext';
import { ThemeProvider } from '@/app/ThemeProvider';
import { AppLayout } from '@/app/AppLayout';

const Index = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </ThemeProvider>
  );
};

export default Index;
