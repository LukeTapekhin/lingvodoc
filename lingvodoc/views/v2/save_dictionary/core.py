from lingvodoc.scripts.save_dictionary import save_dictionary
from lingvodoc.queue.celery import celery


@celery.task
def async_save_dictionary(client_id,
                          object_id,
                          storage,
                          sqlalchemy_url,
                          task_key,
                          cache_kwargs,
                          dict_name,
                          locale_id,
                          published):
    save_dictionary(client_id,
                    object_id,
                    storage,
                    sqlalchemy_url,
                    task_key,
                    cache_kwargs,
                    dict_name,
                    locale_id,
                    published
                    )
    return
