import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UserPlus, CheckCircle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminSetup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { createAdmin } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createAdmin(email.trim(), password);
      
      if (result?.success) {
        setSuccess(true);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result?.error || 'Failed to create admin account');
      }
    } catch (error) {
      console.error('Admin creation error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-choptym-beige via-orange-50 to-yellow-50 px-4">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-choptym-brown">
              Admin Account Created!
            </CardTitle>
            <p className="text-sm text-choptym-brown/70 mt-2">
              Your admin account has been created successfully
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Please check your email to confirm your account before signing in.
            </p>
            <Button 
              onClick={() => window.location.href = '/dash/login'}
              className="w-full bg-gradient-to-r from-choptym-orange to-orange-600 hover:from-choptym-orange/90 hover:to-orange-600/90 text-white"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-choptym-beige via-orange-50 to-yellow-50 px-4">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-choptym-orange to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-choptym-brown">
            Setup Admin Account
          </CardTitle>
          <p className="text-sm text-choptym-brown/70 mt-2">
            Create the first admin account for ChopTym
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-choptym-brown font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@choptym.com"
                className="border-gray-200 focus:border-choptym-orange focus:ring-choptym-orange"
                disabled={loading}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-choptym-brown font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="border-gray-200 focus:border-choptym-orange focus:ring-choptym-orange"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-choptym-brown font-medium">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="border-gray-200 focus:border-choptym-orange focus:ring-choptym-orange"
                disabled={loading}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim() || password !== confirmPassword}
              className="w-full bg-gradient-to-r from-choptym-orange to-orange-600 hover:from-choptym-orange/90 hover:to-orange-600/90 text-white font-medium py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                'Create Admin Account'
              )}
            </Button>

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">
                This will create your first admin account
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup; 