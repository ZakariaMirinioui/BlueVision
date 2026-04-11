import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from '@/stores/useAuthStore';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { signUp, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acceptTerms) {
            setError('You must accept the terms and policies to register.');
            return;
        }

        setError('');
        setSuccess('');

        try {
            const result = await signUp(email, password, username);

            if (result.error) {
                setError(result.error);
                return;
            }

            setSuccess('Registration successful! Redirecting to login...');
            setEmail('');
            setUsername('');
            setPassword('');
            setAcceptTerms(false);
            setTimeout(() => navigate('/login'), 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/10 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
                        Register
                    </h1>
                    <p className="text-muted-foreground">Create your account to access the dashboard</p>
                </div>
                <Card className="border-none shadow-lg shadow-secondary/5">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
                        <CardDescription className="text-center">
                            Enter your username, email and password to register
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Registration Error</AlertTitle>
                                    <AlertDescription>
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {success && (
                                <Alert variant="default" className="bg-green-100 text-green-700 border-green-200">
                                    <UserPlus className="h-4 w-4" />
                                    <AlertTitle>Success</AlertTitle>
                                    <AlertDescription>
                                        {success}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="border-input/50 focus:border-primary"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="border-input/50 focus:border-primary"
                                    required
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="border-input/50 focus:border-primary pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-9 text-gray-400 hover:text-gray-700 bg-transparent border-none shadow-none outline-none focus:outline-none"
                                    tabIndex={-1}
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{ background: 'none', boxShadow: 'none', border: 'none', padding: 0 }}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    id="acceptTerms"
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={e => setAcceptTerms(e.target.checked)}
                                    className="accent-primary"
                                    required
                                />
                                <Label htmlFor="acceptTerms" className="text-sm">
                                    I accept the <a href="/terms" className="text-primary underline">terms and policies</a>
                                </Label>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40"
                                disabled={isLoading || !acceptTerms}
                            >
                                {isLoading ? (
                                    <>Registering...</>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Register
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                <div className="text-center mt-4">
                    <span className="text-muted-foreground">Already have an account? </span>
                    <a href="/login" className="text-primary hover:underline">Sign In</a>
                </div>
            </div>
        </div>
    );
};

export default Register;
