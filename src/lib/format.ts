/**
 * Format resource values (CPU, Memory) to human-readable strings
 */

// CPU units: cores, millicores (m)
// Memory units: bytes, Ki, Mi, Gi, Ti

export function formatResourceValue(value: string, type: 'cpu' | 'memory'): string {
  if (type === 'memory') {
    return formatMemoryValue(value);
  }
  return formatCpuValue(value);
}

function formatMemoryValue(value: string): string {
  // Handle common formats: "1024", "1024iB", "1Ki", "1Mi", "1Gi", "1Ti"
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(i?B|Ki|Mi|Gi|Ti)?$/i);
  if (!match) {
    return value; // Return as-is if we can't parse
  }

  const numValue = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();

  // Convert to bytes if needed
  let bytes: number;
  switch (unit) {
    case 'B':
      bytes = numValue;
      break;
    case 'KI': // KiB
    case 'KIB':
      bytes = numValue * 1024;
      break;
    case 'MI': // MiB
    case 'MIB':
      bytes = numValue * 1024 * 1024;
      break;
    case 'GI': // GiB
    case 'GIB':
      bytes = numValue * 1024 * 1024 * 1024;
      break;
    case 'TI': // TiB
    case 'TIB':
      bytes = numValue * 1024 * 1024 * 1024 * 1024;
      break;
    default:
      bytes = numValue;
  }

  return formatBytes(bytes);
}

function formatCpuValue(value: string): string {
  // Handle millicores (500m) and cores (0.5, 2)
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(m)?$/i);
  if (!match) {
    return value;
  }

  const numValue = parseFloat(match[1]);
  const isMillicores = match[2]?.toLowerCase() === 'm';

  if (isMillicores) {
    // Convert millicores to cores
    const cores = numValue / 1000;
    if (cores >= 1) {
      return `${cores.toFixed(2)} cores`;
    }
    return `${cores.toFixed(3)} cores`;
  }

  // Already in cores
  if (numValue >= 1) {
    return `${numValue.toFixed(1)} cores`;
  }
  return `${numValue.toFixed(2)} cores`;
}

/**
 * Format bytes to human-readable format
 * e.g., 1024 -> "1.00 KiB", 1048576 -> "1.00 MiB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get color based on usage percentage
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 80) {
    return '#ef4444'; // red-500 - Critical
  }
  if (percentage >= 50) {
    return '#eab308'; // yellow-500 - Warning
  }
  return '#22c55e'; // green-500 - Healthy
}

/**
 * Get CSS class for usage badge
 */
export function getUsageBadgeClass(percentage: number): string {
  if (percentage >= 80) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
  if (percentage >= 50) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
}