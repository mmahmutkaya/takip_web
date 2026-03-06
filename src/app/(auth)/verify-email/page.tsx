'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, MailOpen, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') ?? '';

  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setStatus('checking');
      api.post('/auth/verify-email', { token })
        .then((r) => {
          setStatus('success');
          setMessage(r.data.message);
        })
        .catch((e) => {
          setStatus('error');
          setMessage(e.response?.data?.message ?? 'Doğrulama başarısız');
        });
    }
  }, [token]);

  async function handleResend() {
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    setResendStatus('');
    try {
      const r = await api.post('/auth/resend-verification', { email: resendEmail });
      setResendStatus(r.data.message);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setResendStatus(err.response?.data?.message ?? 'Gönderilemedi');
    } finally {
      setResendLoading(false);
    }
  }

  if (token && status === 'checking') {
    return (
      <div className="text-center">
        <Loader2 size={40} className="mx-auto mb-4 animate-spin text-primary" />
        <p className="text-muted-foreground">E-posta adresiniz doğrulanıyor...</p>
      </div>
    );
  }

  if (token && status === 'success') {
    return (
      <div className="text-center">
        <CheckCircle size={44} className="mx-auto mb-4 text-green-500" />
        <h2 className="text-xl font-bold mb-2">Doğrulama Başarılı!</h2>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <Button onClick={() => router.push('/login')} className="w-full">Giriş Yap</Button>
      </div>
    );
  }

  if (token && status === 'error') {
    return (
      <div className="text-center">
        <XCircle size={44} className="mx-auto mb-4 text-destructive" />
        <h2 className="text-xl font-bold mb-2">Doğrulama Başarısız</h2>
        <p className="text-muted-foreground text-sm mb-6">{message}</p>
        <div className="space-y-3">
          <Input
            type="email"
            placeholder="E-posta adresiniz"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
          />
          {resendStatus && <p className="text-xs text-muted-foreground">{resendStatus}</p>}
          <Button onClick={handleResend} disabled={resendLoading} className="w-full">
            {resendLoading ? 'Gönderiliyor...' : 'Yeni Link Gönder'}
          </Button>
        </div>
      </div>
    );
  }

  // Varsayılan: token yok, kayıt sonrası yönlendirme sayfası
  return (
    <div className="text-center">
      <MailOpen size={44} className="mx-auto mb-4 text-primary" />
      <h2 className="text-xl font-bold mb-2">E-postanızı Kontrol Edin</h2>
      <p className="text-muted-foreground text-sm mb-6">
        {emailParam ? (
          <><strong>{emailParam}</strong> adresine bir doğrulama linki gönderdik.</>
        ) : (
          'Kayıtlı e-posta adresinize bir doğrulama linki gönderdik.'
        )}
        {' '}Linke tıklayarak hesabınızı aktifleştirebilirsiniz.
      </p>
      <p className="text-xs text-muted-foreground mb-3">Link gelmedi mi?</p>
      <div className="space-y-3">
        {resendStatus && <p className="text-xs text-muted-foreground text-center">{resendStatus}</p>}
        <Button variant="outline" onClick={handleResend} disabled={resendLoading} className="w-full">
          {resendLoading ? 'Gönderiliyor...' : 'Yeniden Gönder'}
        </Button>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        <Link href="/login" className="text-primary hover:underline">Giriş sayfasına dön</Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-start justify-center bg-muted px-4 pt-32">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Takip</h1>
        </div>
        <div className="bg-card rounded-xl border shadow p-6">
          <Suspense fallback={<div className="text-center py-4 text-muted-foreground">Yükleniyor...</div>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
