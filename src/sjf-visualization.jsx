import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Timer, Plus, Play, Clock, BarChart2, Loader2 } from "lucide-react"
import PropTypes from 'prop-types';
import Footer from './Footer';

const SJF = () => {
  // State Management
  const [processes, setProcesses] = useState([]);
  const [newProcess, setNewProcess] = useState({ id: 1, burstTime: null });
  const [isRunning, setIsRunning] = useState(false);
  const [runningProcess, setRunningProcess] = useState(null);
  const [completedProcesses, setCompletedProcesses] = useState([]);
  const [ganttChart, setGanttChart] = useState([]);

  // Memoize updateProcessorState to prevent recreation on each render
  const updateProcessorState = useCallback(() => {
    if (!runningProcess) {
      if (processes.length > 0) {
        // Sort by burst time only
        const shortestJob = [...processes].sort((a, b) => a.burstTime - b.burstTime)[0];
        const startTime = ganttChart.length > 0 
          ? ganttChart[ganttChart.length - 1].end : 0;
        
        setRunningProcess({...shortestJob, startTime, remainingTime: shortestJob.burstTime});
        setProcesses(processes.filter(p => p.id !== shortestJob.id));
        
        setGanttChart(prev => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.id === shortestJob.id && !lastEntry.end) {
            return prev;
          }
          return [...prev, { id: shortestJob.id, start: startTime }];
        });
      }
    } else {
      const newRemainingTime = runningProcess.remainingTime - 1;
      
      if (newRemainingTime <= 0) {
        const completionTime = runningProcess.startTime + runningProcess.burstTime;
        const completedProcess = {
          ...runningProcess,
          completionTime,
          waitingTime: runningProcess.startTime,
          turnaroundTime: completionTime
        };
        
        setCompletedProcesses(prev => {
          const isAlreadyCompleted = prev.some(p => p.id === completedProcess.id);
          return isAlreadyCompleted ? prev : [...prev, completedProcess];
        });
        
        setGanttChart(prev => {
          const lastEntry = prev[prev.length - 1];
          if (lastEntry && lastEntry.id === completedProcess.id) {
            return prev.map((entry, index) => 
              index === prev.length - 1 ? {...entry, end: completionTime} : entry
            );
          }
          return prev;
        });
        
        setRunningProcess(null);
      } else {
        setRunningProcess({...runningProcess, remainingTime: newRemainingTime});
      }
    }
  }, [ganttChart, processes, runningProcess]);

  // Effect for running the simulation
  useEffect(() => {
    let interval;
    if (isRunning && (processes.length > 0 || runningProcess)) {
      interval = setInterval(() => {
        updateProcessorState();
      }, 1000);
    } else if (isRunning && processes.length === 0 && !runningProcess) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, processes, runningProcess, updateProcessorState]);

  // Add new process
  const addProcess = () => {
    if (newProcess.burstTime <= 0) {
      alert("Burst time must be greater than 0");
      return;
    }
    setProcesses(prev => [...prev, {...newProcess, id: prev.length + 1}]);
    setNewProcess({ id: processes.length + 2, burstTime: 0 });
  };

  // Run SJF algorithm
  const runSJF = () => {
    setIsRunning(true);
    setCompletedProcesses([]);
    setGanttChart([]);
    setRunningProcess(null);
  };

  // Calculate average waiting time
  const calculateAverageWaitingTime = () => {
    if (completedProcesses.length === 0) return 0;
    const totalWaitingTime = completedProcesses.reduce((sum, process) => {
      return sum + process.waitingTime;
    }, 0);
    return totalWaitingTime / completedProcesses.length;
  };

  // Calculate average turnaround time
  const calculateAverageTurnaroundTime = () => {
    if (completedProcesses.length === 0) return 0;
    const totalTurnaroundTime = completedProcesses.reduce((sum, process) => {
      return sum + process.turnaroundTime;
    }, 0);
    return totalTurnaroundTime / completedProcesses.length;
  };

  // Metric Card Component
  const MetricCard = ({ title, value, icon: Icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center space-x-4">
      <div className="p-3 bg-blue-100 rounded-full">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <BarChart2 className="w-8 h-8 text-blue-600" />
        SJF Algorithm Visualization
      </h1>

      <div className="p-4 bg-white rounded-lg shadow-sm mb-6">
        <Label htmlFor="burstTime" className="flex items-center gap-2">
          <Timer className="w-4 h-4" />
          Burst Time
        </Label>
        <Input
          id="burstTime"
          type="number"
          value={newProcess.burstTime}
          placeholder="0"
          onChange={(e) => setNewProcess({ ...newProcess, burstTime: parseInt(e.target.value) || 0 })}
          className="mt-1" />
      </div>

      <div className="flex gap-2 mb-8">
        <Button onClick={addProcess} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Process
        </Button>
        <Button
          onClick={runSJF}
          disabled={isRunning || processes.length === 0}
          className="flex items-center gap-2"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Run SJF Algorithm
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Waiting Processes */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Waiting Processes
          </h3>
          <div className="space-y-2">
            {processes.map((process) => (
              <div key={process.id}
                className="bg-yellow-500 p-3 rounded-lg text-white text-center transform transition-all hover:scale-105">
                P{process.id} (Burst: {process.burstTime})
              </div>
            ))}
          </div>
        </div>

        {/* Processor Status */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3 text-center">Processor Status</h3>
          <div className="w-full aspect-video bg-blue-100 rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
            {runningProcess ? (
              <>
                <div className="absolute inset-0 bg-blue-500 opacity-20 animate-pulse"></div>
                <div className="text-lg font-bold text-blue-800">
                  Processing P{runningProcess.id}
                </div>
              </>
            ) : (
              <div className="text-lg font-bold text-gray-600">Processor Idle</div>
            )}
          </div>
          <div className="w-full bg-gray-200 h-8 rounded-full relative overflow-hidden">
            {runningProcess && (
              <div
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all rounded-full"
                style={{
                  width: `${((runningProcess.burstTime - runningProcess.remainingTime) / runningProcess.burstTime) * 100}%`,
                  transitionDuration: '1s',
                }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
                  P{runningProcess.id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Completed Processes */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" />
            Completed Processes
          </h3>
          <div className="space-y-2">
            {completedProcesses.map((process) => (
              <div key={process.id}
                className="bg-green-500 p-3 rounded-lg text-white text-center transform transition-all hover:scale-105">
                P{process.id} (Burst: {process.burstTime})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          Gantt Chart
        </h3>
        <div className="flex">
          {ganttChart.map((process, index) => (
            <div
              key={index}
              className="h-12 flex items-center justify-center text-white font-bold transition-all hover:brightness-110"
              style={{
                width: `${((process.end || (process.start + runningProcess?.burstTime)) - process.start) * 20}px`,
                backgroundColor: `hsl(${process.id * 30}, 70%, 50%)`,
              }}
            >
              P{process.id}
            </div>
          ))}
        </div>
        <div className="flex mt-1">
          {ganttChart.map((process, index) => (
            <div key={index} className="text-xs" style={{ width: `${((process.end || (process.start + runningProcess?.burstTime)) - process.start) * 20}px` }}>
              {process.start}
            </div>
          ))}
          {ganttChart.length > 0 && (
            <div className="text-xs">
              {ganttChart[ganttChart.length - 1].end || (ganttChart[ganttChart.length - 1].start + runningProcess?.burstTime)}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-blue-500" />
          Process Details
        </h3>
        <div className="w-full overflow-auto mb-5">
          <table className="min-w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-600">Process</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-600">Burst Time</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-600">Waiting Time</th>
                <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-600">Turnaround Time</th>
              </tr>
            </thead>
            <tbody>
              {completedProcesses.map((process) => (
                <tr key={process.id} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-200 px-4 py-3">P{process.id}</td>
                  <td className="border border-gray-200 px-4 py-3">{process.burstTime}</td>
                  <td className="border border-gray-200 px-4 py-3">{process.waitingTime}</td>
                  <td className="border border-gray-200 px-4 py-3">{process.turnaroundTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-8 mt-5">
        <MetricCard
          title="Average Waiting Time"
          value={`${calculateAverageWaitingTime().toFixed(2)}μ`}
          icon={Timer} />
        <MetricCard
          title="Average Turnaround Time"
          value={`${calculateAverageTurnaroundTime().toFixed(2)}μ`}
          icon={Timer} />
      </div>
      <div>
<Footer />
</div>
    </div>
  );
};

SJF.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  icon: PropTypes.element,  // Optional icon element
};

// eslint-disable-next-line react-refresh/only-export-components
export default SJF;





