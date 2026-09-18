"""
Historical Baseline Statistics Calculator
Maintains rolling mean (mu) and standard deviation (sigma) of Fire Radiative Power (FRP)
for persistent industrial coordinates and registered flare stacks.
"""

import math
from typing import Dict, Any, List

class FacilityBaselineTracker:
    def __init__(self):
        # In-memory baseline dictionary
        self.baselines: Dict[str, Dict[str, float]] = {
            "IND-JAMNAGAR-01": {"mu": 44.8, "sigma": 2.8, "samples": 180},
            "IND-HAZIRA-04":   {"mu": 33.5, "sigma": 2.4, "samples": 140},
            "IND-VIZAG-02":    {"mu": 14.2, "sigma": 3.1, "samples": 90},
            "IND-MUNDRA-03":   {"mu": 28.5, "sigma": 4.2, "samples": 120}
        }

    def update_reading(self, facility_id: str, new_frp: float) -> Dict[str, float]:
        """
        Welford's algorithm or exponential moving average update.
        """
        if facility_id not in self.baselines:
            self.baselines[facility_id] = {"mu": new_frp, "sigma": 2.0, "samples": 1}
            return self.baselines[facility_id]

        b = self.baselines[facility_id]
        b["samples"] += 1
        delta = new_frp - b["mu"]
        b["mu"] += delta / b["samples"]
        return b

    def is_anomaly_3sigma(self, facility_id: str, frp: float) -> bool:
        """
        Returns True if FRP > mu + 3*sigma
        """
        b = self.baselines.get(facility_id, {"mu": 20.0, "sigma": 4.0})
        threshold = b["mu"] + (3.0 * b["sigma"])
        return frp > threshold

tracker = FacilityBaselineTracker()
