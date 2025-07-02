import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, KeyRound } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminLogin = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { loginWithPin, isAdmin, loading: authLoading } = useAdminAuth();

  // Clear errors when pin changes
  useEffect(() => {
    setError('');
  }, [pin]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-choptime-beige">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-choptime-orange mx-auto mb-4"></div>
          <p className="text-choptime-brown">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return <Navigate to="/dash/chp-ctrl" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      setError('PIN is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await loginWithPin(pin.trim());
      
      if (!result?.success) {
        setError(result?.error || 'Invalid PIN');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-choptime-beige px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-choptime-brown flex items-center justify-center gap-2">
            <KeyRound className="w-5 h-5 text-choptime-orange" />
            ChopTime Admin
          </CardTitle>
          <p className="text-sm text-choptime-brown/70 mt-2">
            Enter admin PIN to access the dashboard
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="pin">Admin PIN</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit PIN"
                className="text-center text-lg tracking-widest"
                maxLength={4}
                disabled={loading}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || pin.length !== 4}
              className="w-full choptime-gradient hover:opacity-90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;