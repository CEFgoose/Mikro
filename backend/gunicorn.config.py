import multiprocessing

timeout = 0

workers = multiprocessing.cpu_count() * 2 + 1
