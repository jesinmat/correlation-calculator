import { useState } from "react";
import styles from "./table.module.css";
import { correlation } from "@/support/correlation";

export default function Table({
  tickers,
  responses,
}: {
  tickers: string[];
  responses: Map<string, any>;
}) {
  const [corrResults, setCorrResults] = useState<Map<string, string>>(
    new Map()
  );

  const getCorrelation = (ticker: string, secondTicker: string) => {
    const key = `${ticker}-${secondTicker}`;
    const key2 = `${secondTicker}-${ticker}`;

    if (corrResults.has(key)) {
      return corrResults.get(key);
    }

    if (corrResults.has(key2)) {
      return corrResults.get(key2);
    }

    console.log(responses.get(ticker));

    const result = correlation(
      responses.get(ticker),
      responses.get(secondTicker)
    );

    if (typeof result === "number") {
      setCorrResults((prev) => new Map([...prev, [key, result.toFixed(3)]]));
      return result.toFixed(3);
    }
    return result;
  };

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Ticker</th>
          {tickers.map((line) => (
            <th key={line}>{line}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tickers.map((ticker) => (
          <tr key={ticker}>
            <td>{ticker}</td>
            {tickers.map((secondTicker) => (
              <td key={ticker + secondTicker}>
                {getCorrelation(ticker, secondTicker)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
