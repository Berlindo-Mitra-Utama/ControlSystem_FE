/**
 * @fileoverview Custom hook untuk mengelola data produksi.
 * @author Berlindo Team
 */

import { useState, useEffect, useCallback } from "react";
import { ProductionService } from "../services/API_Services";

/**
 * Custom hook untuk mengelola data produksi
 * @returns {Object} State dan functions untuk mengelola data produksi
 */
export const useProductionData = () => {
  const [schedules, setSchedules] = useState([]);
  const [manpowerList, setManpowerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load schedules
  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProductionService.getUserSchedules();
      setSchedules(response.data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading schedules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load manpower
  const loadManpower = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProductionService.getUserManpower();
      setManpowerList(response.data || []);
    } catch (err) {
      console.error("Error loading manpower:", err);
      // Don't set error for manpower loading failure, just log it
      // This prevents the error from showing to user when manpower list is empty
      setManpowerList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save schedule
  const saveSchedule = useCallback(
    async (scheduleData) => {
      try {
        setLoading(true);
        setError(null);

        // Convert frontend data to backend format
        const backendData =
          ProductionService.convertScheduleDataForBackend(scheduleData);

        const response =
          await ProductionService.createProductionSchedule(backendData);

        // Reload schedules after saving
        await loadSchedules();

        return response;
      } catch (err) {
        setError(err.message);
        console.error("Error saving schedule:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadSchedules],
  );

  // Update production data
  const updateData = useCallback(async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await ProductionService.updateProductionData(
        id,
        updateData,
      );

      // Update local state
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) => {
          if (schedule.productionData) {
            const updatedProductionData = schedule.productionData.map((data) =>
              data.id === id ? { ...data, ...updateData } : data,
            );
            return { ...schedule, productionData: updatedProductionData };
          }
          return schedule;
        }),
      );

      return response;
    } catch (err) {
      setError(err.message);
      console.error("Error updating production data:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update multiple production data
  const updateMultipleData = useCallback(async (productionData) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await ProductionService.updateMultipleProductionData(productionData);

      // Update local state
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) => {
          if (schedule.productionData) {
            const updatedProductionData = schedule.productionData.map(
              (data) => {
                const updateItem = productionData.find(
                  (item) => item.id === data.id,
                );
                return updateItem ? { ...data, ...updateItem } : data;
              },
            );
            return { ...schedule, productionData: updatedProductionData };
          }
          return schedule;
        }),
      );

      return response;
    } catch (err) {
      setError(err.message);
      console.error("Error updating multiple production data:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete schedule
  const removeSchedule = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await ProductionService.deleteSchedule(id);

      // Remove from local state
      setSchedules((prevSchedules) =>
        prevSchedules.filter((schedule) => schedule.id !== id),
      );
    } catch (err) {
      setError(err.message);
      console.error("Error deleting schedule:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add manpower
  const addManpower = useCallback(async (name) => {
    try {
      setLoading(true);
      setError(null);

      const response = await ProductionService.createManpower(name);

      // Add to local state
      setManpowerList((prev) => [...prev, response.data]);

      return response;
    } catch (err) {
      console.error("Error adding manpower:", err);
      // Don't set error for manpower operations, just log it
      // This prevents the error from showing to user
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove manpower
  const removeManpower = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await ProductionService.deleteManpower(id);

      // Remove from local state
      setManpowerList((prev) => prev.filter((mp) => mp.id !== id));
    } catch (err) {
      console.error("Error removing manpower:", err);
      // Don't set error for manpower operations, just log it
      // This prevents the error from showing to user
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update manpower
  const updateManpowerData = useCallback(async (id, name) => {
    try {
      setLoading(true);
      setError(null);

      const response = await ProductionService.updateManpower(id, { name });

      // Update local state
      setManpowerList((prev) =>
        prev.map((mp) => (mp.id === id ? response.data : mp)),
      );

      return response;
    } catch (err) {
      console.error("Error updating manpower:", err);
      // Don't set error for manpower operations, just log it
      // This prevents the error from showing to user
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save manpower for specific schedule
  const saveManpowerForScheduleData = useCallback(
    async (scheduleId, manpowerData) => {
      try {
        setLoading(true);
        setError(null);

        const response = await ProductionService.saveManpowerForSchedule(
          scheduleId,
          manpowerData,
        );

        // Update local state if needed
        setSchedules((prevSchedules) =>
          prevSchedules.map((schedule) => {
            if (schedule.id === scheduleId) {
              return { ...schedule, manpowerData: response.data };
            }
            return schedule;
          }),
        );

        return response;
      } catch (err) {
        console.error("Error saving manpower for schedule:", err);
        // Don't set error for manpower operations, just log it
        // This prevents the error from showing to user
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Get manpower for specific schedule
  const getManpowerForScheduleData = useCallback(async (scheduleId) => {
    try {
      setLoading(true);
      setError(null);

      const response =
        await ProductionService.getManpowerForSchedule(scheduleId);

      return response;
    } catch (err) {
      console.error("Error getting manpower for schedule:", err);
      // Don't set error for manpower operations, just log it
      // This prevents the error from showing to user
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadSchedules();
    loadManpower();
  }, [loadSchedules, loadManpower]);

  return {
    // State
    schedules,
    manpowerList,
    loading,
    error,

    // Actions
    loadSchedules,
    loadManpower,
    saveSchedule,
    updateData,
    updateMultipleData,
    removeSchedule,
    addManpower,
    removeManpower,
    updateManpowerData,
    saveManpowerForScheduleData,
    getManpowerForScheduleData,

    // Utility functions
    convertScheduleDataForBackend:
      ProductionService.convertScheduleDataForBackend,
    convertScheduleDataForFrontend:
      ProductionService.convertScheduleDataForFrontend,
  };
};
