frappe.ui.form.on('POS Invoice', {
    refresh: function(frm) {
        if (typeof cur_pos !== 'undefined' && cur_pos.order_summary) {
            const summary = cur_pos.order_summary;

            const original_add_summary_btns = summary.add_summary_btns;
            summary.add_summary_btns = function(conditions) {
                // Replace "Return" with "Void"
                conditions.forEach(condition => {
                    condition.visible_btns = condition.visible_btns.map(btn =>
                        btn === "Return" ? "Void" : btn
                    );
                });

                // Call the original method
                original_add_summary_btns.call(this, conditions);

                // Replace Return button text and class to Void
                this.$summary_btns.find('.return-btn')
                    .text(__("Void"))
                    .addClass('void-btn')
                    .removeClass('return-btn');

                // Attach click event to new Void button
                this.$summary_btns.off("click", ".void-btn").on("click", ".void-btn", function() {
                    // Create a dialog to select POS Invoice
                    let dialog = new frappe.ui.Dialog({
                        title: __('Select POS Invoice For Confirmation To this Void'),
                        fields: [
                            {
                                fieldtype: 'Link',
                                fieldname: 'pos_invoice',
                                label: __('POS Invoice'),
                                options: 'POS Invoice',
                                reqd: 1,
                                get_query: function() {
                                    return {
                                        filters: {
                                            docstatus: 1 
                                        }
                                    };
                                }
                            },
                            {
                                fieldtype: 'Small Text',
                                fieldname: 'comment',
                                label: __('Reason for Void'),
                                reqd: 1
                            }
                        ],
                        primary_action_label: __('Void Invoice'),
                        primary_action: function(values) {
                            let invoice_id = values.pos_invoice;
                            let comment_text = values.comment;

                            frappe.confirm(
                                __('Do you want to cancel this POS Invoice <strong>{0}</strong>?', [invoice_id]),
                                function() {
                                    frappe.call({
                                        method: "frappe.client.cancel",
                                        args: {
                                            doctype: "POS Invoice",
                                            name: invoice_id
                                        },
                                        callback: function(r) {
                                            if (!r.exc) {
                                                frappe.show_alert({
                                                    message: __("POS Invoice {0} has been cancelled.", [invoice_id]),
                                                    indicator: 'green'
                                                });
                                                frappe.call({
                                                    method: "frappe.client.insert",
                                                    args: {
                                                        doc: {
                                                            doctype: "Communication",
                                                            communication_type: "Comment",
                                                            reference_doctype: "POS Invoice",
                                                            reference_name: invoice_id,
                                                            content: comment_text,
                                                            comment_email: frappe.session.user_email,
                                                            sender: frappe.session.user,
                                                            subject: "Void Reason"
                                                        }
                                                    },
                                                    callback: function() {
                                                        frappe.show_alert({
                                                            message: __("Void reason added to POS Invoice {0}.", [invoice_id]),
                                                            indicator: 'blue'
                                                        });
                                                    }
                                                });
                                                if (frm.doc.name === invoice_id) {
                                                    frm.reload_doc().then(() => {
                                                        frm.refresh();
                                                    });
                                                }
                                                cur_pos.refresh();
                                            }
                                        }
                                    });

                                    dialog.hide();
                                },
                                function() {
                                    frappe.show_alert(__("Void action cancelled."));
                                    dialog.hide();
                                }
                            );
                        },
                        secondary_action_label: __('Cancel'),
                        secondary_action: function() {
                            dialog.hide();
                        }
                    });

                    dialog.show();
                });
            };
        }
    }
});
