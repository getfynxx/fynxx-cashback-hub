import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Verification = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="max-w-md w-full">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Verify Your Account</CardTitle>
                    <CardDescription className="text-center">
                        Complete these steps to verify your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold">Follow us on Instagram</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Follow <span className="font-bold">@Getfynxx.in</span> on Instagram
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold">Share on Story</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Share your profile on your Instagram story and tag us
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-center text-muted-foreground mt-4">
                        Once you've completed the steps, please wait for approval. Our team will verify your details and contact you within 2-3 hours.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default Verification;
