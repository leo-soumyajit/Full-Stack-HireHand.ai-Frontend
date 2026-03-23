import React from 'react';

export const MainLoader = ({ text = "Loading..." }: { text?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 min-h-[200px] gap-12">
      <div className="main-loader-container relative w-[30px] h-[30px] ml-[-20px]">
        <div className="top absolute left-[40%] top-[50%] rotate-90">
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bottom absolute left-[40%] top-[50%] -rotate-90">
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="left absolute left-[40%] top-[50%]">
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="right absolute left-[40%] top-[50%] rotate-180">
          <div className="loader-square">
            <div className="loader-square">
              <div className="loader-square">
                <div className="loader-square">
                  <div className="loader-square">
                    <div className="loader-square"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {text && <span className="text-sm font-medium text-muted-foreground animate-pulse mt-8">{text}</span>}

      <style>{`
        .main-loader-container .loader-square {
          width: 8px;
          height: 30px;
          background: hsl(var(--primary));
          border-radius: 10px;
          display: block;
          animation: loader-turn 2.5s ease infinite;
          box-shadow: 0 1px 15px hsl(var(--primary) / 0.5);
        }

        @keyframes loader-turn {
          0% {
            transform: translateX(0) translateY(0) rotate(0);
          }
          70% {
            transform: translateX(400%) translateY(100%) rotate(90deg);
          }
          100% {
            transform: translateX(0) translateY(0) rotate(0);
          }
        }
      `}</style>
    </div>
  );
};
