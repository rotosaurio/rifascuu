import { useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { getSession, signIn } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Form, FormGroup, FormInput, FormLabel } from '@/components/ui/Form';
import { Button } from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

export default function Login() {
  const router = useRouter();
  const { callbackUrl, error: queryError } = router.query;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    queryError as string || null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor ingresa tu email y contraseña');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      // Redirect to callback URL or home page
      router.push(callbackUrl as string || '/');
    } catch (err) {
      console.error('Login error:', err);
      setError('Ocurrió un error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión | RifasCUU</title>
        <meta name="description" content="Inicia sesión para participar en rifas y ganar premios increíbles." />
      </Head>

      <div className="flex min-h-[70vh] items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Iniciar Sesión</h1>
            <p className="text-gray-600">
              Ingresa a tu cuenta para participar en rifas
            </p>
          </div>

          <Card className="p-6">
            {error && (
              <Alert 
                variant="error" 
                className="mb-6"
                onClose={() => setError(null)}
              >
                {error === 'CredentialsSignin' 
                  ? 'Email o contraseña incorrectos' 
                  : error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <FormLabel htmlFor="email" required>
                  Email
                </FormLabel>
                <FormInput
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  autoComplete="email"
                  required
                />
              </FormGroup>

              <FormGroup>
                <div className="flex justify-between items-center">
                  <FormLabel htmlFor="password" required>
                    Contraseña
                  </FormLabel>
                  <Link 
                    href="/recuperar-password" 
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormInput
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  autoComplete="current-password"
                  required
                />
              </FormGroup>

              <div className="mt-8">
                <Button 
                  type="submit" 
                  fullWidth 
                  isLoading={loading}
                >
                  Iniciar Sesión
                </Button>
              </div>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    O continúa con
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: callbackUrl as string || '/' })}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                    </g>
                  </svg>
                  Continuar con Google
                </button>
              </div>
            </div>
          </Card>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link href="/registro" className="font-medium text-blue-600 hover:text-blue-500">
                Regístrate ahora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // If the user is already logged in, redirect to home page
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
