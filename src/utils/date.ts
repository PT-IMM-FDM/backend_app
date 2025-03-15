export const startOfToday = () => {
    const now = new Date();
    let startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0);
    return startOfToday;
    }

export const endOfToday = () => {
    const now = new Date();
    let endOfToday = new Date(now)
    endOfToday.setHours(23, 59, 59, 999);
    return endOfToday;
    }