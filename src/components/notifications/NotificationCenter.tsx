import React, { useState } from 'react'
import {
  Bell,
  BellRing,
  Trash2,
  CheckCheck,
  Settings,
  Star,
  Calendar,
  TrendingUp,
  MapPin,
  CreditCard,
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { LoadingSpinner } from '@/components/ui/loading-states'
import { useNotifications, useNotificationPermission } from '@/hooks/useNotifications'
import type { Notification, NotificationType } from '@/services/notificationsService'
// Simple time formatting utility
const formatDistanceToNow = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return `${Math.floor(diffInSeconds / 604800)}w ago`
}
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications({ limit: 20 })

  const {
    permission,
    requestPermission,
    isSupported,
    isGranted
  } = useNotificationPermission()

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Handle notification action based on type
    switch (notification.type) {
      case 'booking_confirmation':
        // Navigate to bookings page
        break
      case 'new_review':
        // Navigate to reviews page
        break
      case 'recommendation':
        // Navigate to explore page
        break
      default:
        break
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'new_review':
        return <Star className="w-4 h-4 text-yellow-500" />
      case 'event_reminder':
        return <Calendar className="w-4 h-4 text-blue-500" />
      case 'trending_place':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'recommendation':
        return <MapPin className="w-4 h-4 text-purple-500" />
      case 'booking_confirmation':
        return <CreditCard className="w-4 h-4 text-indigo-500" />
      case 'new_favorite':
        return <Heart className="w-4 h-4 text-red-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'new_review':
        return 'bg-yellow-50 border-yellow-200'
      case 'event_reminder':
        return 'bg-blue-50 border-blue-200'
      case 'trending_place':
        return 'bg-green-50 border-green-200'
      case 'recommendation':
        return 'bg-purple-50 border-purple-200'
      case 'booking_confirmation':
        return 'bg-indigo-50 border-indigo-200'
      case 'new_favorite':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('relative', className)}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-80 p-0"
          align="end"
          sideOffset={8}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="h-96">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={() => deleteNotification(notification.id)}
                    icon={getNotificationIcon(notification.type)}
                    colorClass={getNotificationColor(notification.type)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {notifications.length > 0 && (
            <div className="p-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={refresh}
                className="w-full"
              >
                Refresh
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <NotificationSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        permission={permission}
        onRequestPermission={requestPermission}
        isSupported={isSupported}
        isGranted={isGranted}
      />
    </>
  )
}

interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onDelete: () => void
  icon: React.ReactNode
  colorClass: string
}

function NotificationItem({
  notification,
  onClick,
  onDelete,
  icon,
  colorClass
}: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    await onDelete()
  }

  return (
    <div
      className={cn(
        'p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4',
        !notification.read && 'bg-blue-50',
        colorClass
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={cn(
                'text-sm font-medium',
                !notification.read && 'font-semibold'
              )}>
                {notification.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
              >
                {isDeleting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.created_at))}
          </p>
        </div>
      </div>
    </div>
  )
}

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
  permission: NotificationPermission
  onRequestPermission: () => Promise<boolean>
  isSupported: boolean
  isGranted: boolean
}

function NotificationSettings({
  isOpen,
  onClose,
  permission,
  onRequestPermission,
  isSupported,
  isGranted
}: NotificationSettingsProps) {
  const [requesting, setRequesting] = useState(false)

  const handleRequestPermission = async () => {
    setRequesting(true)
    await onRequestPermission()
    setRequesting(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Manage how you receive notifications from TR-ACE
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Browser Notifications</h4>
            {!isSupported ? (
              <p className="text-sm text-gray-600">
                Your browser doesn't support notifications
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge variant={isGranted ? 'default' : 'secondary'}>
                    {permission === 'granted' ? 'Enabled' :
                     permission === 'denied' ? 'Blocked' : 'Not Set'}
                  </Badge>
                </div>

                {permission !== 'granted' && (
                  <Button
                    onClick={handleRequestPermission}
                    disabled={requesting || permission === 'denied'}
                    size="sm"
                    className="w-full"
                  >
                    {requesting ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Requesting...
                      </>
                    ) : permission === 'denied' ? (
                      'Blocked (check browser settings)'
                    ) : (
                      'Enable Notifications'
                    )}
                  </Button>
                )}

                {isGranted && (
                  <p className="text-sm text-green-600">
                    ✓ You'll receive browser notifications for important updates
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Notification Types</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>New reviews on your favorites</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Event reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Trending places near you</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span>Personalized recommendations</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" />
                <span>Booking confirmations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NotificationCenter