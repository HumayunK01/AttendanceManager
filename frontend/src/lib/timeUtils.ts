/**
 * Converts 24-hour time format to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (HH:MM:SS or HH:MM)
 * @returns Time in 12-hour format (h:MM AM/PM)
 */
export const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';

    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Formats a date to a readable string
 * @param date - Date string or Date object
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-GB');
};
