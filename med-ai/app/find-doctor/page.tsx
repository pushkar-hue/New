"use client"

import { PageLayout } from "@/components/page-layout"
import { FindDoctor } from "@/components/find-doctor"
import { ProtectedRoute } from "@/components/protected-route"

export default function FindDoctorPage() {
  return (
    <ProtectedRoute>
      <PageLayout>
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Find a Doctor</h1>
          <FindDoctor />
        </div>
      </PageLayout>
    </ProtectedRoute>
  )
}
