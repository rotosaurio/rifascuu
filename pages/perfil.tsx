import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Form, FormGroup, FormInput, FormLabel } from '@/components/ui/Form';
import Alert from '@/components/ui/Alert';
import { Tabs } from '@/components/ui/Tabs';

export default function Profile() {
  const { data: session } = useSession();
  
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('info');
  
  const [promoCode, setPromoCode] = useState('');

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar perfil');
      }
      
      setSuccess('Perfil actualizado correctamente');
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }
      
      setSuccess('Contraseña cambiada correctamente');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Generate promo code
  const handleGeneratePromoCode = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/user/promo-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al generar código de promoción');
      }
      
      setPromoCode(data.promoCode);
      setSuccess('Código de promoción generado correctamente');
    } catch (err: any) {
      console.error('Promo code generation error:', err);
      setError(err.message || 'Error al generar código de promoción');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Información Personal' },
    { id: 'security', label: 'Seguridad' },
    { id: 'promo', label: 'Promociones' },
  ];

  return (
    <>
      <Head>
        <title>Mi Perfil | RifasCUU</title>
        <meta name="description" content="Gestiona tu perfil de usuario en RifasCUU." />
      </Head>

      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
            <p className="text-gray-600 mt-2">
              Gestiona tu información personal y preferencias
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="md:col-span-1">
              <Card>
                <CardContent className="flex flex-col items-center p-6">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 bg-gray-100">
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'Profile'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-blue-100 text-blue-500">
                        <span className="text-2xl font-semibold">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold mb-1">
                    {session?.user?.name || 'Usuario'}
                  </h3>
                  <p className="text-gray-500 text-sm mb-3">
                    {session?.user?.email || 'email@ejemplo.com'}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button href="/mis-boletos" variant="outline" size="sm">
                      Mis Boletos
                    </Button>
                    <Button href="/my-raffles" variant="outline" size="sm">
                      Mis Rifas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs Content */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <Tabs 
                    tabs={tabs} 
                    activeTab={activeTab} 
                    onChange={setActiveTab}
                    variant="underline" 
                  />
                </CardHeader>
                <CardContent>
                  {error && (
                    <Alert 
                      variant="error" 
                      className="mb-6"
                      onClose={() => setError(null)}
                    >
                      {error}
                    </Alert>
                  )}
                  
                  {success && (
                    <Alert 
                      variant="success" 
                      className="mb-6"
                      onClose={() => setSuccess(null)}
                    >
                      {success}
                    </Alert>
                  )}

                  {/* Personal Information Tab */}
                  {activeTab === 'info' && (
                    <Form onSubmit={handleProfileUpdate}>
                      <FormGroup>
                        <FormLabel htmlFor="name">
                          Nombre Completo
                        </FormLabel>
                        <FormInput
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Tu nombre completo"
                        />
                      </FormGroup>
                      
                      <FormGroup>
                        <FormLabel htmlFor="email">
                          Email
                        </FormLabel>
                        <FormInput
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          El email no se puede cambiar
                        </p>
                      </FormGroup>

                      <div className="mt-6">
                        <Button 
                          type="submit" 
                          isLoading={loading}
                        >
                          Guardar Cambios
                        </Button>
                      </div>
                    </Form>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <Form onSubmit={handlePasswordChange}>
                      <FormGroup>
                        <FormLabel htmlFor="currentPassword" required>
                          Contraseña Actual
                        </FormLabel>
                        <FormInput
                          id="currentPassword"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Ingresa tu contraseña actual"
                          required
                        />
                      </FormGroup>
                      
                      <FormGroup>
                        <FormLabel htmlFor="newPassword" required>
                          Nueva Contraseña
                        </FormLabel>
                        <FormInput
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 8 caracteres"
                          required
                        />
                      </FormGroup>
                      
                      <FormGroup>
                        <FormLabel htmlFor="confirmPassword" required>
                          Confirmar Contraseña
                        </FormLabel>
                        <FormInput
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite tu nueva contraseña"
                          required
                        />
                      </FormGroup>

                      <div className="mt-6">
                        <Button 
                          type="submit" 
                          isLoading={loading}
                        >
                          Cambiar Contraseña
                        </Button>
                      </div>
                    </Form>
                  )}

                  {/* Promotional Code Tab */}
                  {activeTab === 'promo' && (
                    <div>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              Genera tu código promocional y compártelo. Por cada persona que lo use, recibirás 1 rifa gratis.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {promoCode ? (
                        <div className="mb-6">
                          <p className="text-sm text-gray-600 mb-2">Tu código promocional:</p>
                          <div className="flex items-center">
                            <code className="bg-gray-100 px-4 py-2 rounded-md text-lg font-bold flex-1">
                              {promoCode}
                            </code>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(promoCode);
                                alert('Código copiado al portapapeles');
                              }}
                              className="ml-2 p-2 text-gray-500 hover:text-gray-700"
                              aria-label="Copiar código"
                            >
                              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={handleGeneratePromoCode}
                          isLoading={loading}
                        >
                          Generar Código Promocional
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/perfil',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
};