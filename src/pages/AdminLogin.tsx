
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, AlertCircle, CheckCircle, UserPlus, KeyRound } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'create' | 'reset'>('login');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  const { loginAdmin, createAdmin, resetPassword, isAdmin, loading: authLoading } = useAdminAuth();

  // Clear errors when form changes
  useEffect(() => {
    setError('');
    setSuccess('');
    setValidationErrors({});
  }, [email, password, mode]);

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

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (mode !== 'reset') {
      if (!password.trim()) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;
      
      if (mode === 'login') {
        result = await loginAdmin(email.trim(), password);
      } else if (mode === 'create') {
        result = await createAdmin(email.trim(), password);
      } else if (mode === 'reset') {
        result = await resetPassword(email.trim());
      }
      
      if (result?.success) {
        if (result.message) {
          setSuccess(result.message);
          if (mode !== 'login') {
            // Switch back to login mode after success
            setTimeout(() => setMode('login'), 3000);
          }
        }
      } else {
        setError(result?.error || 'Operation failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getModeConfig = () => {
    switch (mode) {
      case 'create':
        return {
          title: 'Create Admin Account',
          buttonText: 'Create Account',
          icon: <UserPlus className="w-5 h-5 text-blue-600" />
        };
      case 'reset':
        return {
          title: 'Reset Password',
          buttonText: 'Send Reset Email',
          icon: <KeyRound className="w-5 h-5 text-orange-600" />
        };
      default:
        return {
          title: 'ChopTime Admin',
          buttonText: 'Sign In',
          icon: null
        };
    }
  };

  const config = getModeConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-choptime-beige px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-choptime-brown flex items-center justify-center gap-2">
            {config.icon}
            {config.title}
          </CardTitle>
          <p className="text-sm text-choptime-brown/70 mt-2">
            {mode === 'login' && 'Sign in to access the admin dashboard'}
            {mode === 'create' && 'Create a new admin account'}
            {mode === 'reset' && 'Enter your email to reset password'}
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

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@choptime.com"
                className={validationErrors.email ? 'border-red-500' : ''}
                disabled={loading}
                required
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
              )}
            </div>
            
            {mode !== 'reset' && (
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={validationErrors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {validationErrors.password && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.password}</p>
                )}
              </div>
            )}

            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full choptime-gradient hover:opacity-90 text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'login' ? 'Signing in...' : mode === 'create' ? 'Creating...' : 'Sending...'}
                </>
              ) : (
                config.buttonText
              )}
            </Button>

            {/* Mode switching buttons */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              {mode === 'login' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('reset')}
                    className="w-full text-sm"
                  >
                    Forgot Password?
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('create')}
                    className="w-full text-sm"
                  >
                    Create Admin Account
                  </Button>
                </>
              )}
              
              {(mode === 'create' || mode === 'reset') && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode('login')}
                  className="w-full text-sm"
                >
                  Back to Login
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
