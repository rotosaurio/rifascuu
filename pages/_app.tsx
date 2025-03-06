import { SessionProvider, useSession } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import '../styles/globals.css';

// Create a proper interface for AppContent props
interface AppContentProps {
  Component: AppProps['Component'];
  pageProps: any;
}

function AppContent({ Component, pageProps }: AppContentProps) {
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);
  const { data: session } = useSession();

  // Add page transition effect
  useEffect(() => {
    const handleStart = () => setPageLoading(true);
    const handleComplete = () => setPageLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Check user roles
  useEffect(() => {
    const checkUserStatus = () => {
      try {
        if (session?.user?.role === 'admin') {
          setIsAdmin(true);
          setIsCompanyOwner(false);
        } else if (session?.user?.role === 'company_owner') {
          setIsAdmin(false);
          setIsCompanyOwner(true);
        } else {
          setIsAdmin(false);
          setIsCompanyOwner(false);
        }
      } catch (error) {
        setIsAdmin(false);
        setIsCompanyOwner(false);
      }
    };

    checkUserStatus();
  }, [session]);

  return (
    <Layout isAdmin={isAdmin} isCompanyOwner={isCompanyOwner}>
      {pageLoading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Component {...pageProps} />
      )}
    </Layout>
  );
}

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider 
      session={session}
      refetchInterval={5 * 60} // Revalidate every 5 minutes
      refetchOnWindowFocus={true}
    >
      <AppContent Component={Component} pageProps={pageProps} />
    </SessionProvider>
  );
}
