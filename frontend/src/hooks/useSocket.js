import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

function useSocket(token) {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState('')

  useEffect(() => {
    if (!token) return undefined

    const socketInstance = io(import.meta.env.VITE_API_BASE_URL, {
      auth: { token },
      transports: ['websocket'],
    })

    const handleConnect = () => {
      setIsConnected(true)
      setConnectionError('')
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleConnectError = (error) => {
      setConnectionError(error?.message || 'Socket connection failed')
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('connect_error', handleConnectError)

    setSocket(socketInstance)

    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('connect_error', handleConnectError)
      socketInstance.disconnect()
      setSocket(null)
    }
  }, [token])

  return {
    socket,
    isConnected,
    connectionError,
  }
}

export default useSocket
