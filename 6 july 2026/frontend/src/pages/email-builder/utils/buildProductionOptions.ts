export function buildProductionOption(chartProps:any,chartData:any){

          if (
              !Array.isArray(chartData) ||
              chartData.length === 0 ||
              !Array.isArray(chartData[0]?.segments)
          ) {
              return {
              };
          }
          const palette = [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
              "#84cc16",
              "#f97316",
          ];
          const colorMap = new Map<string, string>();
          let colorIndex = 0;    
            const maxSegments = Math.max(
                ...chartData.map(
                    hour => hour.segments.length
                )
            );
            const series = [];

            for (let layer = 0; layer < maxSegments; layer++) {
                series.push({
                    name: `Layer ${layer}`,
                    type: "bar",
                    stack: "production",

                    data: new Array(chartData.length).fill("-"),

                    itemStyle: {},
                });
            }
    
          chartData.forEach((hour, hourIndex) => {

                hour.segments.forEach((segment, layerIndex) => {
                    if (!segment || !segment.type) {
                        return;
                    }
                let value = 0;

                switch (chartProps.config.aggregation) {

                    case "sum":
                        value = segment.sum;
                        break;

                    case "avg":
                        value = segment.sum / segment.count;
                        break;

                    case "min":
                        value = segment.min;
                        break;

                    case "max":
                        value = segment.max;
                        break;
                }

                const product = segment.type ?? "Unknown";

                if (!colorMap.has(product)) {
                    colorMap.set(
                        product,
                        palette[colorIndex % palette.length]
                    );
                    colorIndex++;
                }

                series[layerIndex].data[hourIndex] = {
                    value,

                    product: product,

                    start: segment.start,

                    end: segment.end,

                    itemStyle: {
                        color: colorMap.get(product),
                    },
                };

                });

            });

        const legendData = [...colorMap.keys()];

        const legendChildren: any[] = [];

        let x = 0;

        for (const [product, color] of colorMap) {

            legendChildren.push(
                {
                    type: "rect",

                    shape: {
                        x,
                        y: 0,
                        width: 14,
                        height: 14,
                    },

                    style: {
                        fill: color,
                    },
                },

                {
                    type: "text",

                    style: {
                        x: x + 20,
                        y: 7,

                        text: product,

                        textVerticalAlign: "middle",

                        fill: "#333",

                        fontSize: 12,
                    },
                }
            );

            x += 20 + product.length * 8 + 20;
        }

          return {
            xAxis: {
                type: "category",
                data: chartData.map(bucket => bucket.label),
            },
    
              yAxis: {
                  type: "value",
              },

              legend: {
                    bottom: 0,
                    left: "center",
                    data: legendData,
                },
    
              tooltip: {
                  trigger: "axis",
                  formatter: (params: any) => {
    
                      const lines = [
                          `<strong>${params[0].axisValue}</strong>`,
                          "<hr/>",
                      ];
                      params.forEach((p: any) => {
                          if (p.data == null || p.data === "-") return;
                      const durationMinutes =
                      Math.round(
                          (new Date(p.data.end).getTime() -
                          new Date(p.data.start).getTime()) / 60000
                      );
                      lines.push(
                          `<span style="color:${p.color}">●</span> ${p.data.product}: <strong>${p.data.value}</strong>`
                      );
                      });
                      return lines.join("<br/>");
                  },
              },

              graphic: [
                {
                    type: "group",

                    left: "center",
                    bottom: 10,

                    children: legendChildren,
                },
            ],
    
              series,
          };
}