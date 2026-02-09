import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AboutUsDialogProps {
  isDarkMode?: boolean;
}

export const AboutUsDialog = ({ isDarkMode = false }: AboutUsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* About Us Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className={cn(
          "transition-colors duration-300",
          isDarkMode 
            ? "text-gray-400 hover:text-white hover:bg-gray-700" 
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        )}
        title="About Us"
      >
        <Info className="w-5 h-5" />
      </Button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={cn(
            "relative w-full max-w-2xl mx-4 rounded-lg shadow-2xl transition-colors duration-300",
            isDarkMode ? "bg-gray-800" : "bg-white"
          )}>
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-full transition-colors duration-300",
                isDarkMode 
                  ? "text-gray-400 hover:text-white hover:bg-gray-700" 
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className={cn(
              "px-8 py-6 border-b transition-colors duration-300",
              isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className={cn(
                    "text-2xl font-bold transition-colors duration-300",
                    isDarkMode ? "text-white" : "text-gray-900"
                  )}>About Us</h2>
                  <p className={cn(
                    "text-sm transition-colors duration-300",
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  )}>SPMC Referral System</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6">
              {/* System Description */}
              <div>
                <h3 className={cn(
                  "text-lg font-semibold mb-2 transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>System Overview</h3>
                <p className={cn(
                  "text-sm leading-relaxed transition-colors duration-300",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  The SPMC Referral System is a comprehensive platform designed to streamline the patient referral process, 
                  enabling efficient coordination between healthcare facilities and the Southern Philippines Medical Center.
                </p>
              </div>

              {/* Development Team */}
              <div>
                <h3 className={cn(
                  "text-lg font-semibold mb-3 transition-colors duration-300",
                  isDarkMode ? "text-white" : "text-gray-900"
                )}>Development Team</h3>
                <p className={cn(
                  "text-sm mb-4 transition-colors duration-300",
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                )}>
                  This system was developed by interns from the University of the Immaculate Conception:
                </p>
                <div className="space-y-3">
                  {[
                    { name: "Wilfredo G. Marinay Jr.", email: "wmarinay_220000001044@uic.edu.ph" },
                    { name: "Andre Jose C. Ruiz", email: "aruiz_220000001163@uic.edu.ph" },
                    { name: "Jayci Gabriel F. Acuña", email: "jacuna_220000001342@uic.edu.ph" }
                  ].map((developer, index) => (
                    <div 
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors duration-300",
                        isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                      )}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-semibold">
                          {developer.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium transition-colors duration-300",
                          isDarkMode ? "text-white" : "text-gray-900"
                        )}>{developer.name}</p>
                        <p className={cn(
                          "text-xs transition-colors duration-300",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>Developer</p>
                        <a 
                          href={`mailto:${developer.email}`}
                          className={cn(
                            "text-xs transition-colors duration-300 hover:underline",
                            isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
                          )}
                        >
                          {developer.email}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Institution & Achievement */}
              <div className={cn(
                "p-5 rounded-lg border transition-colors duration-300",
                isDarkMode 
                  ? "bg-blue-900/20 border-blue-700" 
                  : "bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-semibold transition-colors duration-300",
                      isDarkMode ? "text-blue-300" : "text-blue-900"
                    )}>
                      University of the Immaculate Conception
                    </p>
                    <p className={cn(
                      "text-xs mt-1 transition-colors duration-300",
                      isDarkMode ? "text-blue-400" : "text-blue-700"
                    )}>
                      Internship Program
                    </p>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-colors duration-300",
                    isDarkMode 
                      ? "bg-green-900/30 text-green-400" 
                      : "bg-green-100 text-green-700"
                  )}>
                    48 Days
                  </div>
                </div>
                <div className={cn(
                  "mt-3 pt-3 border-t transition-colors duration-300",
                  isDarkMode ? "border-blue-700/50" : "border-blue-200"
                )}>
                  <p className={cn(
                    "text-xs leading-relaxed transition-colors duration-300",
                    isDarkMode ? "text-blue-300" : "text-blue-800"
                  )}>
                    This comprehensive referral management system was successfully developed and deployed 
                    in just <span className="font-semibold">48 days</span>, demonstrating exceptional dedication, 
                    technical expertise, and efficient project execution by the development team.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={cn(
              "px-8 py-4 border-t flex justify-end transition-colors duration-300",
              isDarkMode ? "border-gray-700" : "border-gray-200"
            )}>
              <Button
                onClick={() => setIsOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
