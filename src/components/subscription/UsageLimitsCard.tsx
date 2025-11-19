'use client';

/**
 * Usage Limits Card Component
 * @description Card para mostrar uso atual vs limites do plano
 */

import { useEffect, useState } from 'react';
import { Activity, BarChart3, FolderOpen, Users } from 'lucide-react';

interface UsageLimits {
  limits: {
    max_experiments: number;
    max_projects: number;
    max_visitors: number;
  };
  usage: {
    experiments_count: number;
    active_experiments_count: number;
    projects_count: number;
    visitors_count: number;
  };
  permissions: {
    can_create_experiment: boolean;
    can_create_project: boolean;
  };
}

export function UsageLimitsCard() {
  const [data, setData] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimits();
  }, []);

  async function fetchLimits() {
    try {
      const response = await fetch('/api/subscription/limits');
      if (response.ok) {
        const limitsData = await response.json();
        setData(limitsData);
      }
    } catch (error) {
      console.error('Failed to fetch limits:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { limits, usage, permissions } = data;

  const formatLimit = (limit: number) =>
    limit === -1 ? 'Ilimitado' : limit.toString();

  const getPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getColorClass = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Uso do Plano</h3>

        <div className="space-y-4">
          {/* Experimentos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Experimentos</span>
              </div>
              <span className="text-sm text-gray-600">
                {usage.experiments_count} / {formatLimit(limits.max_experiments)}
              </span>
            </div>
            {limits.max_experiments !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getColorClass(getPercentage(usage.experiments_count, limits.max_experiments))}`}
                  style={{
                    width: `${getPercentage(usage.experiments_count, limits.max_experiments)}%`,
                  }}
                ></div>
              </div>
            )}
            {!permissions.can_create_experiment && (
              <p className="text-xs text-red-600 mt-1">
                Limite atingido. Faça upgrade para criar mais.
              </p>
            )}
          </div>

          {/* Projetos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FolderOpen className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Projetos</span>
              </div>
              <span className="text-sm text-gray-600">
                {usage.projects_count} / {formatLimit(limits.max_projects)}
              </span>
            </div>
            {limits.max_projects !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getColorClass(getPercentage(usage.projects_count, limits.max_projects))}`}
                  style={{
                    width: `${getPercentage(usage.projects_count, limits.max_projects)}%`,
                  }}
                ></div>
              </div>
            )}
            {!permissions.can_create_project && (
              <p className="text-xs text-red-600 mt-1">
                Limite atingido. Faça upgrade para criar mais.
              </p>
            )}
          </div>

          {/* Visitors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Visitantes (mês)</span>
              </div>
              <span className="text-sm text-gray-600">
                {usage.visitors_count?.toLocaleString()} /{' '}
                {formatLimit(limits.max_visitors)}
              </span>
            </div>
            {limits.max_visitors !== -1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getColorClass(getPercentage(usage.visitors_count || 0, limits.max_visitors))}`}
                  style={{
                    width: `${getPercentage(usage.visitors_count || 0, limits.max_visitors)}%`,
                  }}
                ></div>
              </div>
            )}
          </div>

          {/* Experimentos Ativos */}
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Ativos agora</span>
              </div>
              <span className="text-sm font-medium">
                {usage.active_experiments_count}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/billing"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            Ver todos os planos →
          </a>
        </div>
      </div>
    </div>
  );
}
