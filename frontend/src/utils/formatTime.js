export default function formatTimestamp(timestamp) {
    const now = Date.now()
    const messageTime = new Date(timestamp).getTime()
    const timeDifference = now - messageTime
    if(timeDifference<60000) return 'now'
    if(timeDifference<3600000) return `${Math.floor(timeDifference/60000)} minutes ago`
    if(timeDifference<86400000) return `${Math.floor(timeDifference/3600000)} hours ago`
    return `${Math.floor(timeDifference/86400000)} days ago`
}