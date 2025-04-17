"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Camera, Mic } from "lucide-react"

export function VideoDebugHelper() {
  const [cameraStatus, setCameraStatus] = useState<"unknown" | "available" | "unavailable">("unknown")
  const [micStatus, setMicStatus] = useState<"unknown" | "available" | "unavailable">("unknown")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [webRTCSupport, setWebRTCSupport] = useState<boolean>(false)
  const [socketStatus, setSocketStatus] = useState<"unknown" | "connected" | "disconnected">("unknown")

  const checkMediaDevices = async () => {
    try {
      // Check WebRTC support
      if (
        typeof RTCPeerConnection !== "undefined" &&
        typeof navigator.mediaDevices !== "undefined" &&
        typeof navigator.mediaDevices.getUserMedia !== "undefined"
      ) {
        setWebRTCSupport(true)
      } else {
        setWebRTCSupport(false)
        setErrorMessage("WebRTC is not fully supported in this browser")
        return
      }

      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("MediaDevices API is not supported in this browser")
        setCameraStatus("unavailable")
        setMicStatus("unavailable")
        return
      }

      // List available devices
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      setDevices(deviceList)

      // Check camera
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
        videoStream.getTracks().forEach((track) => track.stop())
        setCameraStatus("available")
      } catch (err) {
        console.error("Camera access error:", err)
        setCameraStatus("unavailable")
        setErrorMessage(`Camera error: ${err instanceof Error ? err.message : String(err)}`)
      }

      // Check microphone
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioStream.getTracks().forEach((track) => track.stop())
        setMicStatus("available")
      } catch (err) {
        console.error("Microphone access error:", err)
        setMicStatus("unavailable")
        setErrorMessage(`Microphone error: ${err instanceof Error ? err.message : String(err)}`)
      }

      // Check socket connection
      const socket = window.socket
      if (socket) {
        setSocketStatus(socket.connected ? "connected" : "disconnected")
      } else {
        setSocketStatus("disconnected")
      }
    } catch (err) {
      console.error("Media device check error:", err)
      setErrorMessage(`General error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  useEffect(() => {
    checkMediaDevices()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Media Device Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className={cameraStatus === "available" ? "text-green-500" : "text-red-500"} />
                <span>Camera: {cameraStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className={micStatus === "available" ? "text-green-500" : "text-red-500"} />
                <span>Microphone: {micStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${webRTCSupport ? "bg-green-500" : "bg-red-500"}`}></span>
                <span>WebRTC Support: {webRTCSupport ? "Yes" : "No"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${
                    socketStatus === "connected"
                      ? "bg-green-500"
                      : socketStatus === "disconnected"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  }`}
                ></span>
                <span>Socket Connection: {socketStatus}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Browser Information:</h4>
              <div className="text-sm space-y-1">
                <p>User Agent: {navigator.userAgent}</p>
                <p>Browser: {navigator.userAgent.match(/chrome|firefox|safari|edge|opera/i)?.[0] || "Unknown"}</p>
                <p>Secure Context: {window.isSecureContext ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div>
            <h4 className="font-medium mb-2">Available Devices:</h4>
            <ul className="text-sm space-y-1">
              {devices.length === 0 ? (
                <li>No devices detected</li>
              ) : (
                devices.map((device, index) => (
                  <li key={index}>
                    {device.kind}: {device.label || `Device ${index + 1}`}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button onClick={checkMediaDevices}>Refresh Device Status</Button>
            <Button
              variant="outline"
              onClick={() => {
                if (window.location.href.includes("?")) {
                  window.location.href = window.location.href + "&debug=true"
                } else {
                  window.location.href = window.location.href + "?debug=true"
                }
              }}
            >
              Enable Debug Mode
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
