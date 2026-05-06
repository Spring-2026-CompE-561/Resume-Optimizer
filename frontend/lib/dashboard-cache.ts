"use client";

import {
  fetchJobPostings,
  fetchMe,
  fetchOptimizations,
  fetchResumes,
} from "@/lib/api";
import type {
  AuthUser,
  JobPostingRecord,
  OptimizationRunRecord,
  ResumeRecord,
} from "@/lib/types";

type DashboardResourceMap = {
  jobPostings: JobPostingRecord[];
  optimizations: OptimizationRunRecord[];
  resumes: ResumeRecord[];
  user: AuthUser;
};

type DashboardResourceKey = keyof DashboardResourceMap;

type ResourceState<T> = {
  data?: T;
  promise?: Promise<T>;
};

const resourceState: {
  [K in DashboardResourceKey]: ResourceState<DashboardResourceMap[K]>;
} = {
  jobPostings: {},
  optimizations: {},
  resumes: {},
  user: {},
};

async function loadResource<K extends DashboardResourceKey>(
  key: K,
  loader: () => Promise<DashboardResourceMap[K]>,
) {
  const cached = resourceState[key];

  if (cached.data !== undefined) {
    return cached.data;
  }

  if (cached.promise) {
    return cached.promise;
  }

  const promise = loader()
    .then((result) => {
      resourceState[key].data = result;
      resourceState[key].promise = undefined;
      return result;
    })
    .catch((error) => {
      resourceState[key].promise = undefined;
      throw error;
    });

  resourceState[key].promise = promise;
  return promise;
}

export function loadCurrentUser() {
  return loadResource("user", fetchMe);
}

export function loadResumes() {
  return loadResource("resumes", fetchResumes);
}

export function loadJobPostings() {
  return loadResource("jobPostings", fetchJobPostings);
}

export function loadOptimizations() {
  return loadResource("optimizations", fetchOptimizations);
}

export function primeCurrentUser(user: AuthUser) {
  resourceState.user.data = user;
}

export function invalidateDashboardResource(key: DashboardResourceKey) {
  resourceState[key].data = undefined;
  resourceState[key].promise = undefined;
}

export function clearDashboardCache() {
  invalidateDashboardResource("user");
  invalidateDashboardResource("resumes");
  invalidateDashboardResource("jobPostings");
  invalidateDashboardResource("optimizations");
}
