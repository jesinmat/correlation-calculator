export interface TickerData {
  res: [
    {
      date: string;
      close: number;
    }
  ];
}

export function correlation(x: TickerData, y: TickerData) {
  if (!x || !x.res || !y || !y.res) {
    return "--";
  }

  const { earliestCommonDate, commonDatesSet } = findCommonWeekDates(x, y);

  if (!earliestCommonDate) {
    return "--";
  }

  // Filter the data to include only the entries from the earliest common date onwards
  const xData = x.res
    .filter(
      (item) => item.date >= earliestCommonDate && commonDatesSet.has(item.date)
    )
    .map((item) => item.close);
  const yData = y.res
    .filter(
      (item) => item.date >= earliestCommonDate && commonDatesSet.has(item.date)
    )
    .map((item) => item.close);

  const length = xData.length;

  const sumX = xData.reduce((a, b) => a + b, 0);
  const sumY = yData.reduce((a, b) => a + b, 0);

  const sumX2 = xData.reduce((a, b) => a + b * b, 0);
  const sumY2 = yData.reduce((a, b) => a + b * b, 0);

  const sumXY = xData.reduce((a, b, i) => a + b * yData[i], 0);

  const numerator = length * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (length * sumX2 - sumX * sumX) * (length * sumY2 - sumY * sumY)
  );

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

function findCommonWeekDates(x: TickerData, y: TickerData) {
  // Find the earliest common date
  const xDates = new Set(x.res.map((item) => item.date));
  const yDates = new Set(y.res.map((item) => item.date));
  const commonDates = Array.from(xDates).filter((date) => yDates.has(date));
  commonDates.sort();
  const commonDatesSet = new Set(commonDates);

  if (commonDates.length === 0) {
    return { earliestCommonDate: undefined, commonDatesSet };
  }

  const earliestCommonDate = commonDates[0];
  const commonWeeks = [];
  let currentPoint = new Date(earliestCommonDate);
  // Find the next Friday
  while (currentPoint.getUTCDay() % 7 !== 5) {
    currentPoint.setDate(currentPoint.getDate() + 1);
  }
  while (currentPoint < new Date()) {
    currentPoint.setDate(currentPoint.getDate() + 7);
    const currentDate = currentPoint.toISOString();
    if (!commonDatesSet.has(currentDate)) {
      continue;
    }
    commonWeeks.push(currentDate);
  }

  commonDatesSet.clear();
  commonWeeks.forEach((date) => commonDatesSet.add(date));

  return { earliestCommonDate, commonDatesSet };
}
