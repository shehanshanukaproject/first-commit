'use client'
import { useState, useEffect } from 'react'

/**
 * Returns the current user's Pro status and plan details.
 *
 * Usage:
 *   const { isPro, isLoading, plan, subscriptionId, memberSince, lecturesThisMonth } = useProStatus()
 */
export function useProStatus() {
  const [state, setState] = useState({
    isPro: false,
    plan: null,
    subscriptionId: null,
    memberSince: null,
    lecturesThisMonth: 0,
    lectureLimit: 3,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function fetchPlan() {
      try {
        const res = await fetch('/api/user/plan')
        if (!res.ok) throw new Error('Failed to fetch plan')
        const data = await res.json()
        if (!cancelled) {
          setState({
            isPro: data.plan === 'pro',
            plan: data.plan || 'free',
            subscriptionId: data.subscriptionId || null,
            memberSince: data.memberSince || null,
            lecturesThisMonth: data.lecturesThisMonth || 0,
            lectureLimit: data.lectureLimit || 3,
            isLoading: false,
            error: null,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setState(prev => ({ ...prev, isLoading: false, error: err.message }))
        }
      }
    }

    fetchPlan()
    return () => { cancelled = true }
  }, [])

  return state
}
