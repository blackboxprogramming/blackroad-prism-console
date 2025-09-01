# Architecture

This document outlines the structure of the research pipeline used in this repository.

* **Analysis scripts** live in `analysis/` and can be run as standalone Python modules.
* Each script reads raw experiment data and produces figures or tables consumed by the wider project.
* Supporting utilities and shared components are kept minimal so that analyses remain transparent.

