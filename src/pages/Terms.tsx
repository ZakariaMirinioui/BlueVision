import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4">
            <div className="w-full max-w-5xl">
                <Card className="border-none shadow-2xl shadow-blue-200/30 bg-white/90 backdrop-blur-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-0">
                        <button
                            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 bg-transparent border-none outline-none focus:outline-none"
                            onClick={() => navigate('/register')}
                            aria-label="Back to Sign Up"
                            style={{ background: 'none', border: 'none', boxShadow: 'none', padding: 0 }}
                        >
                            <ArrowLeft className="h-6 w-6" />
                            <span className="text-base font-medium">Back</span>
                        </button>
                        <CardTitle className="text-4xl font-extrabold text-center w-full tracking-tight bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
                            Terms & Policies
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 mt-2">
                        <div className="prose max-w-none text-gray-800 prose-h2:text-2xl prose-h2:font-bold prose-h2:text-blue-700 prose-h3:text-xl prose-h3:font-semibold prose-h3:text-blue-600 prose-p:leading-relaxed prose-ul:pl-6 prose-li:mb-1 prose-strong:text-blue-700 prose-a:text-blue-600 prose-a:underline">
                            <h2 className="text-2xl font-bold text-blue-700">1. Acceptance of Terms</h2>
                            <p>By creating an account, accessing, or using the Blue Vision platform (the "Service"), you agree to be bound by these Terms & Policies. Please read them carefully before registering. If you do not agree with all the terms and conditions of this agreement, you may not create an account or use the Service. Your use of the Service constitutes a legally binding agreement to abide by these terms. We reserve the right to update or modify these Terms & Policies at any time without prior notice. Your continued use of the Service following any such changes constitutes your acceptance of the new terms.</p>
                            <h2 className="text-2xl font-bold text-blue-700 mt-8">2. Privacy Policy</h2>
                            <p>Your data is securely stored and will not be shared with unauthorized third parties without your consent. This section outlines how we collect, use, and protect your information.</p>
                            <ul>
                                <li><strong>Information Collection:</strong> We collect both personal and non-personal data.</li>
                                <li><strong>Personal Data:</strong> This includes information you provide directly during account creation, such as your full name, email address, company name (Brinks Security client ID), and password. We also collect any additional information you provide to our support team.</li>
                                <li><strong>Non-Personal Data:</strong> This includes usage data and technical information. We automatically collect data about your activity on the Blue Vision platform, such as IP addresses, browser type, operating system, the pages you view, and the time and date of your visits. This data is used to improve the service and for troubleshooting purposes.</li>
                                <li><strong>Use of Your Data:</strong> Your data is used to:
                                    <ul>
                                        <li>Verify your identity as an authorized Brinks Security client.</li>
                                        <li>Operate, maintain, and provide the features and functionality of the Blue Vision Service.</li>
                                        <li>Store and display the content you upload on your designated digital signage screens.</li>
                                        <li>Communicate with you regarding service updates, security alerts, and technical support.</li>
                                        <li>Analyze and monitor usage trends and preferences to improve the Service's performance and design.</li>
                                        <li>Enforce our Terms & Policies and comply with legal obligations.</li>
                                    </ul>
                                </li>
                                <li><strong>Data Security:</strong> We employ industry-standard security measures, including data encryption, firewalls, and secure server hosting, to protect your personal and company data from unauthorized access, alteration, disclosure, or destruction. While we strive to protect your information, no method of transmission over the Internet or method of electronic storage is 100% secure.</li>
                                <li><strong>Third-Party Disclosure:</strong> We may share your data with trusted third parties who assist us in providing the Service (e.g., our hosting provider, Xibo Digital Signage). These parties are bound by confidentiality agreements and are prohibited from using your data for any purpose other than providing the agreed-upon services. We will not sell, rent, or trade your data to third parties for marketing purposes.</li>
                                <li><strong>Data Retention:</strong> We will retain your data for as long as your account is active and for a reasonable period thereafter to facilitate account recovery, comply with legal obligations, and resolve disputes.</li>
                            </ul>
                            <h2 className="text-2xl font-bold text-blue-700 mt-8">3. User Responsibilities</h2>
                            <p>You are responsible for maintaining the confidentiality of your account and password. Any misuse of the Blue Vision platform may result in account suspension or termination.</p>
                            <ul>
                                <li><strong>Account Security:</strong> You are solely responsible for all activities that occur under your account, whether or not you authorized them. You must notify us immediately of any unauthorized use of your account or any other breach of security. We are not liable for any loss or damage arising from your failure to comply with this security obligation.</li>
                                <li><strong>Content & Conduct:</strong> You are responsible for all content (text, images, videos, etc.) that you upload, post, or display on the Blue Vision Service. You agree that your content and your conduct on the platform will not:
                                    <ul>
                                        <li>Violate any applicable law or regulation.</li>
                                        <li>Infringe upon the intellectual property rights of any third party.</li>
                                        <li>Be unlawful, threatening, abusive, harassing, defamatory, libelous, or deceptive.</li>
                                        <li>Contain viruses or other malicious code.</li>
                                        <li>Be used for any purpose other than managing your Brinks Security-related digital signage.</li>
                                    </ul>
                                </li>
                                <li><strong>Service Integrity:</strong> You agree not to interfere with or disrupt the Blue Vision Service or the servers and networks connected to the Service. You may not attempt to gain unauthorized access to any portion of the Service, other accounts, or computer systems.</li>
                            </ul>
                            <h2 className="text-2xl font-bold text-blue-700 mt-8">4. Contact Support</h2>
                            <p>If you have any questions or concerns about our terms or policies, or if you need assistance with your account, please contact our support team below.</p>
                            <ul>
                                <li><strong>Email:</strong> <a href="mailto:zikomirinoui@gmail.com" className="text-blue-400 hover:text-blue-600 transition-colors font-semibold">zikomirinoui@gmail.com</a></li>
                                <li><strong>Phone:</strong> <a href="tel:+212629258876" className="text-blue-400 hover:text-blue-600 transition-colors font-semibold">+212 629258876</a></li>
                                <li><strong>Hours of Operation:</strong> Monday - Friday, 9:00 AM - 5:00 PM - Brinks Casablanca Agency</li>
                            </ul>
                            <p>We are committed to resolving your queries in a timely and efficient manner.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Terms;
