import dynamic from "next/dynamic";
import { Suspense } from "react";

const SignUpForm = dynamic(() => import("./SignUpForm"), { ssr: false });

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-4">
      {/* Background decoration - server rendered */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo - server rendered */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <img src="/logo.png" alt="MenoDAO" className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit">MenoDAO</h1>
          <p className="text-emerald-200 mt-2">Member Portal</p>
        </div>

        {/* Form - dynamically loaded */}
        <Suspense
          fallback={
            <div className="bg-white rounded-2xl shadow-2xl p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4 w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded mb-6 w-1/2 mx-auto" />
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded" />
                <div className="h-12 bg-gray-200 rounded" />
              </div>
            </div>
          }
        >
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
