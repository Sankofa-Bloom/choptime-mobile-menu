import React, { useState } from 'react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, Key } from 'lucide-react';

const SimpleAdminLogin: React.FC = () => {
  const { loginWithPin, loginWithEmail } = useSimpleAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginWithPin(pin);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginWithEmail(email, password);
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            ChopTym Admin
          </CardTitle>
          <p className="text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pin">Quick Login</TabsTrigger>
              <TabsTrigger value="email">Email Login</TabsTrigger>
            </TabsList>

            {/* PIN Login */}
            <TabsContent value="pin">
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin PIN
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter admin PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default PIN: 1035
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            {/* Email Login */}
            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="admin@choptym.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              For development: Use PIN "1035" or create an admin account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAdminLogin;