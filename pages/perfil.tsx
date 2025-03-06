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
                    <Button href="/mis-rifas" variant="outline"