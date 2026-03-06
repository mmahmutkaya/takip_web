'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(1, 'Şifre gerekli'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [lastEmail, setLastEmail] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setShowResend(false);
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message ?? 'Giriş başarısız';
      setError(msg);
      if (msg.includes('doğrulanmamış')) {
        setLastEmail(data.email);
        setShowResend(true);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Takip</h1>
          <p className="text-muted-foreground mt-1">Hesabınıza giriş yapın</p>
        </div>
        <div className="bg-card rounded-xl border shadow p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" placeholder="ornek@sirket.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Şifre</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            {showResend && (
              <p className="text-sm text-center">
                <Link
                  href={`/verify-email?email=${encodeURIComponent(lastEmail)}`}
                  className="text-primary hover:underline"
                >
                  Doğrulama linkini yeniden gönder
                </Link>
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="text-primary hover:underline">Kayıt olun</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
